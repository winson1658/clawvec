import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

/**
 * GET /api/news
 * 獲取新聞列表（含互動數據：likes_count, comments_count, reactions）
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

    // Source: all — fetch from both sources with equal share
    if (source === 'all') {
      const halfLimit = Math.ceil(limit / 2);

      // Fetch task-driven observations
      let obsQuery = supabase
        .from('observations')
        .select(`
          *,
          author:author_id (id, username, display_name)
        `, { count: 'exact' })
        .eq('status', 'published')
        .eq('category', 'tech')
        .order('published_at', { ascending: false });

      const { data: obs, count: obsCount } = await obsQuery.range(offset, offset + halfLimit - 1);

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
          // Denormalized counts from observations table
          likes_count: o.likes_count || 0,
          views: o.views || 0,
        }));
        totalCount += (obsCount || 0);
      }

      // Fetch daily news
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

      const { data: daily, count: dailyCount } = await dailyQuery.range(offset, offset + halfLimit - 1);

      if (daily) {
        news = [...news, ...daily.map((d: any) => ({
          ...d,
          is_task_driven: false,
          // Daily news doesn't have denormalized counts yet
          likes_count: 0,
          views: 0,
        }))];
        totalCount += (dailyCount || 0);
      }
    }

    // Source: tasks only
    if (source === 'tasks') {
      let obsQuery = supabase
        .from('observations')
        .select(`
          *,
          author:author_id (id, username, display_name)
        `, { count: 'exact' })
        .eq('status', 'published')
        .eq('category', 'tech')
        .order('published_at', { ascending: false });

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
          likes_count: o.likes_count || 0,
          views: o.views || 0,
        }));
        totalCount += (obsCount || 0);
      }
    }

    // Source: daily only
    if (source === 'daily') {
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

      const { data: daily, count: dailyCount } = await dailyQuery.range(offset, offset + limit - 1);

      if (daily) {
        news = daily.map((d: any) => ({
          ...d,
          is_task_driven: false,
          likes_count: 0,
          views: 0,
        }));
        totalCount += (dailyCount || 0);
      }
    }

    // Aggregate interaction data for all news items
    if (news.length > 0) {
      const allIds = news.map(n => n.id);

      // For task-driven: target_type = 'observation'; for daily: target_type = 'news'
      const taskIds = news.filter(n => n.is_task_driven).map(n => n.id);
      const dailyIds = news.filter(n => !n.is_task_driven).map(n => n.id);

      // Batch fetch likes for daily news
      if (dailyIds.length > 0) {
        const { data: dailyLikes } = await supabase
          .from('likes')
          .select('target_id')
          .eq('target_type', 'news')
          .in('target_id', dailyIds);

        const likesById: Record<string, number> = {};
        dailyLikes?.forEach((l: any) => {
          likesById[l.target_id] = (likesById[l.target_id] || 0) + 1;
        });

        news.forEach(n => {
          if (!n.is_task_driven && likesById[n.id]) {
            n.likes_count = likesById[n.id];
          }
        });
      }

      // Batch fetch comments for all
      const commentTypes = [];
      if (taskIds.length > 0) commentTypes.push({ type: 'observation', ids: taskIds });
      if (dailyIds.length > 0) commentTypes.push({ type: 'news', ids: dailyIds });

      for (const ct of commentTypes) {
        const { data: commentsData } = await supabase
          .from('comments')
          .select('target_id')
          .eq('target_type', ct.type)
          .in('target_id', ct.ids)
          .eq('is_deleted', false)
          .is('parent_id', null);

        const commentsById: Record<string, number> = {};
        commentsData?.forEach((c: any) => {
          commentsById[c.target_id] = (commentsById[c.target_id] || 0) + 1;
        });

        news.forEach(n => {
          const targetType = n.is_task_driven ? 'observation' : 'news';
          if (targetType === ct.type && commentsById[n.id]) {
            n.comments_count = commentsById[n.id];
          }
        });
      }

      // Batch fetch reactions for all
      for (const ct of commentTypes) {
        const { data: reactionsData } = await supabase
          .from('reactions')
          .select('target_id, reaction_type')
          .eq('target_type', ct.type)
          .in('target_id', ct.ids);

        const reactionsById: Record<string, Record<string, number>> = {};
        reactionsData?.forEach((r: any) => {
          if (!reactionsById[r.target_id]) reactionsById[r.target_id] = {};
          reactionsById[r.target_id][r.reaction_type] = (reactionsById[r.target_id][r.reaction_type] || 0) + 1;
        });

        news.forEach(n => {
          const targetType = n.is_task_driven ? 'observation' : 'news';
          if (targetType === ct.type && reactionsById[n.id]) {
            n.reactions = reactionsById[n.id];
          }
        });
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
