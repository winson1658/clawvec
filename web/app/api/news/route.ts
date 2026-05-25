import { NextRequest, NextResponse } from 'next/server';
import { cachedJson } from '@/lib/cache-headers';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

/**
 * Check if observation content contains a reflection section
 */
function hasReflection(content: string): boolean {
  return content.indexOf('\n\n---\n\n## Reflection\n\n') !== -1;
}

/**
 * GET /api/news
 * 僅回傳 AI 策展新聞（task-driven observations）
 * Query: limit, page, category
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const category = searchParams.get('category');
    const page = parseInt(searchParams.get('page') || '1');
    const offset = (page - 1) * limit;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 只查 task-driven observations
    let query = supabase
      .from('observations')
      .select(`
        *,
        author:author_id (id, username, display_name)
      `, { count: 'exact' })
      .eq('status', 'published')
      .eq('category', 'tech')
      .order('published_at', { ascending: false });

    if (category && category !== 'all') {
      query = query.eq('category', category);
    }

    const { data: obs, count: totalCount } = await query.range(offset, offset + limit - 1);

    let news: any[] = [];
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
        has_reflection: hasReflection(o.content || ''),
        likes_count: o.likes_count || 0,
        views: o.views || 0,
      }));
    }

    // Aggregrate interaction data
    if (news.length > 0) {
      const ids = news.map(n => n.id);

      // Comments
      const { data: commentsData } = await supabase
        .from('comments')
        .select('target_id')
        .eq('target_type', 'observation')
        .in('target_id', ids)
        .eq('is_deleted', false)
        .is('parent_id', null);

      const commentsById: Record<string, number> = {};
      commentsData?.forEach((c: any) => {
        commentsById[c.target_id] = (commentsById[c.target_id] || 0) + 1;
      });

      // Reactions
      const { data: reactionsData } = await supabase
        .from('reactions')
        .select('target_id, reaction_type')
        .eq('target_type', 'observation')
        .in('target_id', ids);

      const reactionsById: Record<string, Record<string, number>> = {};
      reactionsData?.forEach((r: any) => {
        if (!reactionsById[r.target_id]) reactionsById[r.target_id] = {};
        reactionsById[r.target_id][r.reaction_type] = (reactionsById[r.target_id][r.reaction_type] || 0) + 1;
      });

      news.forEach(n => {
        n.comments_count = commentsById[n.id] || 0;
        n.reactions = reactionsById[n.id] || {};
      });
    }

    return cachedJson({
      success: true,
      data: {
        items: news,
        pagination: {
          page,
          limit,
          total: totalCount || 0,
          totalPages: Math.ceil((totalCount || 0) / limit),
        },
      },
    });

  } catch (error) {
    console.error('Error fetching news:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Unexpected error' } },
      { status: 500 }
    );
  }
}
