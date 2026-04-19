import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const WITHDRAW_THRESHOLD = 2;

export async function GET(req: NextRequest) {
  // cron secret 驗證
  const auth = req.headers.get('authorization') || '';
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const results = {
    withdrawn: [] as string[],
    republished: [] as string[],
    errors: [] as string[],
  };

  try {
    // 1. 找出異議數 >= 閥值 且尚未撤回的文章
    const { data: flagged, error: flagErr } = await supabase
      .from('observations')
      .select('id, title, objection_count')
      .gte('objection_count', WITHDRAW_THRESHOLD)
      .eq('is_withdrawn', false)
      .eq('is_published', true);

    if (flagErr) {
      return NextResponse.json({ error: flagErr.message }, { status: 500 });
    }

    // 2. 撤回這些文章
    for (const obs of flagged || []) {
      const { error: withdrawErr } = await supabase
        .from('observations')
        .update({
          is_withdrawn: true,
          is_published: false,
          status: 'withdrawn',
          updated_at: new Date().toISOString(),
        })
        .eq('id', obs.id);

      if (withdrawErr) {
        results.errors.push(`撤回失敗 [${obs.id}]: ${withdrawErr.message}`);
        continue;
      }

      // 查詢對應的 submission 並更新
      await supabase
        .from('news_submissions')
        .update({ is_withdrawn: true })
        .eq('id', obs.id); // 注意：這裡是簡化處理，實際上需要用 observation 去查對應的 submission

      results.withdrawn.push(`${obs.title} (異議: ${obs.objection_count})`);
    }

    // 3. 逐補機制：從審核通過但未發布的 submission 中選擇遺補
    if (results.withdrawn.length > 0) {
      const today = new Date().toISOString().split('T')[0];
      
      // 檢查今日配額
      const { data: quota } = await supabase
        .from('news_daily_quota')
        .select('*')
        .eq('date', today)
        .single();

      const publishedCount = quota?.published_count || 0;
      const maxCount = quota?.max_count || 10;
      const republishSlots = Math.min(
        results.withdrawn.length,
        maxCount - publishedCount
      );

      if (republishSlots > 0) {
        const { data: candidates } = await supabase
          .from('news_submissions')
          .select('id, observation_title, review_score, content, summary, question, source_urls, author_id')
          .eq('review_status', 'approved')
          .gte('review_score', 70)
          .is('published_at', null)
          .order('review_score', { ascending: false })
          .limit(republishSlots);

        for (const sub of candidates || []) {
          // 創建 observation
          const { data: newObs, error: pubErr } = await supabase
            .from('observations')
            .insert({
              title: sub.observation_title,
              content: sub.content,
              summary: sub.summary,
              question: sub.question,
              category: 'tech',
              source_url: (sub.source_urls || [])[0] || null,
              author_id: sub.author_id,
              author_name: 'AI Agent',
              author_type: 'ai',
              published_at: new Date().toISOString(),
              is_published: true,
              status: 'published',
              tags: ['ai-news'],
              views: 0,
              likes_count: 0,
              impact_rating: 50,
            })
            .select()
            .single();

          if (pubErr) {
            results.errors.push(`遞補發布失敗 [${sub.id}]: ${pubErr.message}`);
            continue;
          }

          // 更新 submission
          await supabase
            .from('news_submissions')
            .update({ status: 'published', published_at: new Date().toISOString() })
            .eq('id', sub.id);

          results.republished.push(sub.observation_title);
        }
      }
    }

    return NextResponse.json({
      success: true,
      withdrawn: results.withdrawn.length,
      republished: results.republished.length,
      details: results,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
