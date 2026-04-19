import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization') || '';
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // 每月 1日自務選出上個月最重要的 AI 轉折
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const firstDayOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString();

    // 查詢上個月發布的文章，按多維度評分
    const { data: candidates, error } = await supabase
      .from('observations')
      .select('id, title, views, likes_count, objection_count, created_at')
      .eq('is_published', true)
      .eq('is_withdrawn', false)
      .gte('created_at', firstDayOfMonth)
      .lt('created_at', firstDayOfNextMonth)
      .order('likes_count', { ascending: false })
      .limit(30);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 計算綜合得分（views + likes*3 - objections*5）
    const scored = (candidates || [])
      .map(obs => ({
        ...obs,
        score: (obs.views || 0) + (obs.likes_count || 0) * 3 - (obs.objection_count || 0) * 5,
      }))
      .sort((a, b) => b.score - a.score);

    // 標記前 5 篇為重要轉折
    const top5 = scored.slice(0, 5);
    const featuredIds = top5.map(o => o.id);

    if (featuredIds.length > 0) {
      // 取消舊的標記
      await supabase
        .from('observations')
        .update({ is_milestone: false })
        .eq('is_milestone', true);

      // 標記新的
      await supabase
        .from('observations')
        .update({ is_milestone: true })
        .in('id', featuredIds);
    }

    return NextResponse.json({
      success: true,
      month: now.toISOString().slice(0, 7),
      featured: top5.map(o => ({
        id: o.id,
        title: o.title,
        score: o.score,
        views: o.views,
        likes: o.likes_count,
        objections: o.objection_count,
      })),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
