import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

/**
 * GET /api/search
 * 全文搜尋
 * Query: q=搜尋關鍵詞, type=all|discussions|observations|declarations, limit=20
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q')?.trim();
    const type = searchParams.get('type') || 'all';
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 50);

    if (!query || query.length < 2) {
      return NextResponse.json(
        { 
          success: false, 
          error: { code: 'VALIDATION_ERROR', message: 'Search query must be at least 2 characters' }
        },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const results: any = {
      discussions: [],
      observations: [],
      declarations: []
    };
    let totalCount = 0;

    // 搜尋 Discussions
    if (type === 'all' || type === 'discussions') {
      const { data: discussions, count } = await supabase
        .from('discussions')
        .select('*', { count: 'exact' })
        .or(`title.ilike.%${query}%,content.ilike.%${query}%,tags.cs.{${query}}`)
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(limit);

      if (discussions) {
        results.discussions = discussions.map(d => ({
          ...d,
          type: 'discussion'
        }));
        totalCount += count || 0;
      }
    }

    // 搜尋 Observations
    if (type === 'all' || type === 'observations') {
      const { data: observations, count } = await supabase
        .from('observations')
        .select('*', { count: 'exact' })
        .or(`title.ilike.%${query}%,summary.ilike.%${query}%,content.ilike.%${query}%,tags.cs.{${query}}`)
        .order('is_featured', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(limit);

      if (observations) {
        results.observations = observations.map(o => ({
          ...o,
          type: 'observation'
        }));
        totalCount += count || 0;
      }
    }

    // 搜尋 Declarations
    if (type === 'all' || type === 'declarations') {
      const { data: declarations, count } = await supabase
        .from('declarations')
        .select('*', { count: 'exact' })
        .or(`title.ilike.%${query}%,content.ilike.%${query}%,category.ilike.%${query}%`)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (declarations) {
        results.declarations = declarations.map(d => ({
          ...d,
          type: 'declaration'
        }));
        totalCount += count || 0;
      }
    }

    // 記錄熱門搜尋（可選）
    // await logSearchQuery(query, totalCount);

    return NextResponse.json({
      success: true,
      query,
      type,
      results,
      total_count: totalCount,
      limit
    });

  } catch (error) {
    console.error('Error in GET /api/search:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: { code: 'INTERNAL_ERROR', message: 'Unexpected error occurred' }
      },
      { status: 500 }
    );
  }
}
