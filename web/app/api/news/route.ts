import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

/**
 * GET /api/news
 * 獲取新聞列表
 * Query params:
 *   - limit: 數量限制 (default: 10)
 *   - category: 分類篩選
 *   - source: 'daily' | 'tasks' | 'all' (default: 'all')
 *   - page: 頁碼
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const category = searchParams.get('category');
    const source = searchParams.get('source') || 'all';
    const page = parseInt(searchParams.get('page') || '1');
    const offset = (page - 1) * limit;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let news: any[] = [];
    let totalCount = 0;

    // Source: tasks (任務驅動的 observations)
    if (source === 'tasks' || source === 'all') {
      let obsQuery = supabase
        .from('observations')
        .select(`
          *,
          author:author_id (id, username, display_name)
        `, { count: 'exact' })
        .eq('status', 'published')
        .eq('category', 'news')
        .order('published_at', { ascending: false });

      if (category && category !== 'all') {
        // 若有分類篩選，可能需要從 meta 或 tags 篩選
        // 目前先略過細分類
      }

      const { data: obs, count: obsCount } = await obsQuery.range(offset, offset + limit - 1);

      if (obs) {
        news = obs.map((o: any) => ({
          id: o.id,
          title: o.title,
          title_zh: o.title,
          summary: o.summary,
          summary_zh: o.summary,
          ai_perspective: o.content,
          url: o.source_url,
          image_url: null,
          published_at: o.published_at,
          source: { name: o.author?.display_name || o.author?.username || 'Clawvec AI', name_zh: o.author?.display_name || o.author?.username || 'Clawvec AI' },
          importance_score: 80,
          category: 'ai',
          author_id: o.author_id,
          is_task_driven: true,
        }));
        totalCount += (obsCount || 0);
      }
    }

    // Source: daily (原有 daily_news)
    if (source === 'daily' || source === 'all') {
      const remainingLimit = limit - news.length;
      if (remainingLimit > 0) {
        const dailyOffset = Math.max(0, offset - totalCount);

        let dailyQuery = supabase
          .from('daily_news')
          .select(`
            *,
            source:source_id (name, name_zh, base_url)
          `, { count: 'exact' })
          .in('status', ['active', 'published'])
          .order('importance_score', { ascending: false })
          .order('published_at', { ascending: false });

        if (category && category !== 'all') {
          dailyQuery = dailyQuery.eq('category', category);
        }

        const { data: daily, count: dailyCount } = await dailyQuery.range(dailyOffset, dailyOffset + remainingLimit - 1);

        if (daily) {
          news = [...news, ...daily.map((d: any) => ({ ...d, is_task_driven: false }))];
          totalCount += (dailyCount || 0);
        }
      }
    }

    // 重新排序：任務驅動的放前面
    news.sort((a, b) => {
      if (a.is_task_driven && !b.is_task_driven) return -1;
      if (!a.is_task_driven && b.is_task_driven) return 1;
      return new Date(b.published_at).getTime() - new Date(a.published_at).getTime();
    });

    return NextResponse.json({
      success: true,
      news: news.slice(0, limit),
      pagination: {
        page,
        limit,
        total: totalCount,
        hasMore: news.length === limit,
      },
      meta: {
        source,
      }
    });

  } catch (error) {
    console.error('Error fetching news:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Unexpected error' } },
      { status: 500 }
    );
  }
}
