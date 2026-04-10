import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

/**
 * GET /api/news
 * 獲取每日新聞列表
 * Query params:
 *   - limit: 數量限制 (default: 10)
 *   - category: 分類篩選
 *   - date: 特定日期 (YYYY-MM-DD)
 *   - page: 頁碼
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const category = searchParams.get('category');
    const date = searchParams.get('date');
    const page = parseInt(searchParams.get('page') || '1');
    const offset = (page - 1) * limit;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let query = supabase
      .from('daily_news')
      .select(`
        *,
        source:source_id (name, name_zh, base_url)
      `)
      .eq('status', 'active')
      .order('importance_score', { ascending: false })
      .order('published_at', { ascending: false });

    if (category) {
      query = query.eq('category', category);
    }

    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      
      query = query
        .gte('published_at', startOfDay.toISOString())
        .lte('published_at', endOfDay.toISOString());
    }

    const { data: news, error, count } = await query
      .range(offset, offset + limit - 1);

    if (error) {
      return NextResponse.json(
        { success: false, error: { code: 'FETCH_ERROR', message: error.message } },
        { status: 500 }
      );
    }

    // 獲取今日統計
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const { count: todayCount } = await supabase
      .from('daily_news')
      .select('*', { count: 'exact', head: true })
      .gte('published_at', today.toISOString());

    return NextResponse.json({
      success: true,
      news: news || [],
      pagination: {
        page,
        limit,
        total: count,
        hasMore: (news?.length || 0) === limit
      },
      stats: {
        todayCount: todayCount || 0
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
