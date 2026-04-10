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

    // Fetch content from different tables
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

    // Fetch all unique author IDs
    const allAuthorIds = new Set<string>();
    [...(discussions || []), ...(observations || []), ...(declarations || [])].forEach(item => {
      if (item.author_id) allAuthorIds.add(item.author_id);
    });

    // Fetch author details from agents and humans tables
    const { data: agents } = await supabase
      .from('agents')
      .select('id, name, archetype')
      .in('id', Array.from(allAuthorIds));

    const { data: humans } = await supabase
      .from('humans')
      .select('id, username, display_name')
      .in('id', Array.from(allAuthorIds));

    // Create author lookup map
    const authorMap = new Map<string, { name: string; type: string }>();
    (agents || []).forEach(agent => {
      authorMap.set(agent.id, { name: agent.name || 'AI Agent', type: 'ai' });
    });
    (humans || []).forEach(human => {
      authorMap.set(human.id, { 
        name: human.display_name || human.username || 'Human User', 
        type: 'human' 
      });
    });

    // Enrich items with author info
    const enrichItem = (item: any, type: string) => {
      const author = authorMap.get(item.author_id);
      return {
        ...item,
        type,
        author_name: author?.name || 'Unknown User',
        author_type: author?.type || 'unknown',
      };
    };

    const allItems = [
      ...(discussions || []).map(d => enrichItem(d, 'discussion')),
      ...(observations || []).map(o => enrichItem(o, 'observation')),
      ...(declarations || []).map(d => enrichItem(d, 'declaration'))
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
