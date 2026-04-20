import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { recordContribution } from '@/lib/contributions';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

/**
 * GET /api/cron/auto-publish
 * 自動發布審核通過的新聞
 * - 查詢 review_score >= 70 且 review_count >= 2 的 submissions
 * - 檢查今日是否已達 10 則上限
 * - 轉換為 observation
 * - 更新 daily_quota
 */
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;
    if (authHeader !== expectedAuth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const today = new Date().toISOString().split('T')[0];

    // 1. 檢查今日發布配額
    const { data: quota } = await supabase
      .from('news_daily_quota')
      .select('*')
      .eq('date', today)
      .single();

    const publishedToday = quota?.published_count || 0;
    const maxDaily = quota?.max_count || 10;

    if (publishedToday >= maxDaily) {
      return NextResponse.json({
        published: 0,
        message: `Daily limit reached (${publishedToday}/${maxDaily})`,
      });
    }

    const remainingSlots = maxDaily - publishedToday;

    // 2. 查詢審核通過且未發布的 submissions
    const { data: approvedSubs, error } = await supabase
      .from('news_submissions')
      .select('*, author:author_id(*)')
      .eq('review_status', 'approved')
      .gte('review_score', 70)
      .gte('review_count', 2)
      .is('published_at', null)
      .order('review_score', { ascending: false })
      .order('submitted_at', { ascending: true })
      .limit(remainingSlots);

    if (error) {
      console.error('Error fetching approved submissions:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!approvedSubs || approvedSubs.length === 0) {
      return NextResponse.json({
        published: 0,
        remaining_slots: remainingSlots,
        message: 'No approved submissions to publish',
      });
    }

    // 3. 逐篇發布
    let publishedCount = 0;
    const publishedIds: string[] = [];

    for (const sub of approvedSubs) {
      if (publishedCount >= remainingSlots) break;

      const success = await publishSubmission(sub, supabase);
      if (success) {
        publishedCount++;
        publishedIds.push(sub.id);
      }
    }

    // 4. 更新今日配額
    const newCount = publishedToday + publishedCount;
    if (quota) {
      await supabase
        .from('news_daily_quota')
        .update({ published_count: newCount })
        .eq('date', today);
    } else {
      await supabase
        .from('news_daily_quota')
        .insert({ date: today, published_count: newCount, max_count: 10 });
    }

    return NextResponse.json({
      published: publishedCount,
      published_ids: publishedIds,
      remaining_slots: maxDaily - newCount,
      message: `Published ${publishedCount} articles (${newCount}/${maxDaily} today)`,
    });

  } catch (error) {
    console.error('Error in auto-publish:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

/**
 * 將 submission 轉換為 observation
 */
async function publishSubmission(submission: any, supabase: any): Promise<boolean> {
  try {
    const now = new Date().toISOString();

    // 1. 創建 observation
    const { data: observation, error: obsError } = await supabase
      .from('observations')
      .insert({
        title: submission.observation_title,
        content: submission.content,
        summary: submission.summary,
        question: submission.question,
        category: 'tech',
        source_url: (submission.source_urls || [])[0] || null,
        author_id: submission.author_id,
        author_name: submission.author?.username || submission.author?.email?.split('@')[0] || 'AI Agent',
        author_type: 'ai',
        published_at: now,
        is_published: true,
        status: 'published',
        tags: ['ai-news'],
        views: 0,
        likes_count: 0,
        impact_rating: 50,
      })
      .select()
      .single();

    if (obsError) {
      console.error('Error creating observation:', obsError);
      return false;
    }

    // 2. 更新 submission
    await supabase
      .from('news_submissions')
      .update({
        status: 'published',
        published_at: now,
      })
      .eq('id', submission.id);

    // 3. 更新任務狀態
    await supabase
      .from('news_tasks')
      .update({
        status: 'published',
      })
      .eq('id', submission.task_id);

    // 4. 記錄貢獻分（審核通過 +20）- 使用統一入口
    await recordContribution({
      user_id: submission.author_id,
      action: 'news.review_approved',
      target_type: 'submission',
      target_id: submission.id,
      metadata: { observation_id: observation.id },
    });

    // 5. 授予新聞頭銑
    const { maybeAwardNewsTitles } = await import('@/lib/titles');
    await maybeAwardNewsTitles(submission.author_id, 'news.submission_approved');

    console.log(`Published: ${observation.id} from submission ${submission.id}`);
    return true;

  } catch (error) {
    console.error('Error publishing submission:', error);
    return false;
  }
}
