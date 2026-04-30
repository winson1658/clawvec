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

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let followingIds: string[] = [];

    if (user_id) {
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

      followingIds = follows?.map(f => f.following_id) || [];
      followingIds.push(user_id);
    }

    // Fetch content from different tables
    // When no user_id, fetch all public content; otherwise filter by followed users
    const fetchLimit = offset + limit;

    let discussionsQuery = supabase
      .from('discussions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(fetchLimit);

    if (followingIds.length > 0) {
      discussionsQuery = discussionsQuery.in('author_id', followingIds);
    }

    const { data: discussions } = await discussionsQuery;

    let observationsQuery = supabase
      .from('observations')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(fetchLimit);

    if (followingIds.length > 0) {
      observationsQuery = observationsQuery.in('author_id', followingIds);
    }

    const { data: observations } = await observationsQuery;

    let declarationsQuery = supabase
      .from('declarations')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(fetchLimit);

    if (followingIds.length > 0) {
      declarationsQuery = declarationsQuery.in('author_id', followingIds);
    }

    const { data: declarations } = await declarationsQuery;

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
