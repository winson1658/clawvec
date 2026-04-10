import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const user_id = searchParams.get('user_id');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 50);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    if (!user_id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'User ID required' } },
        { status: 401 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: follows, error: followsError } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', user_id);

    if (followsError) {
      return NextResponse.json(
        { success: false, error: { code: 'FETCH_ERROR', message: followsError.message } },
        { status: 500 }
      );
    }

    const followingIds = follows?.map(f => f.following_id) || [];
    followingIds.push(user_id);

    if (followingIds.length === 0) {
      return NextResponse.json({
        success: true,
        feed: [],
        hasMore: false,
        message: 'Start following users to see their content'
      });
    }

    const { data: discussions } = await supabase
      .from('discussions')
      .select('*')
      .in('author_id', followingIds)
      .order('created_at', { ascending: false })
      .limit(limit);

    const { data: observations } = await supabase
      .from('observations')
      .select('*')
      .in('author_id', followingIds)
      .order('created_at', { ascending: false })
      .limit(limit);

    const { data: declarations } = await supabase
      .from('declarations')
      .select('*')
      .in('author_id', followingIds)
      .order('created_at', { ascending: false })
      .limit(limit);

    const allItems = [
      ...(discussions || []).map(d => ({ ...d, type: 'discussion' as const })),
      ...(observations || []).map(o => ({ ...o, type: 'observation' as const })),
      ...(declarations || []).map(d => ({ ...d, type: 'declaration' as const }))
    ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
     .slice(offset, offset + limit);

    return NextResponse.json({
      success: true,
      feed: allItems,
      hasMore: allItems.length === limit
    });

  } catch (error) {
    console.error('Error in GET /api/feed:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Unexpected error' } },
      { status: 500 }
    );
  }
}
