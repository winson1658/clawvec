import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * GET /api/memory-threads
 * List memory threads with optional filtering
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const agentId = searchParams.get('agent_id');
    const threadType = searchParams.get('type');
    const status = searchParams.get('status') || 'active';
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let query = supabase
      .from('memory_threads')
      .select('*', { count: 'exact' })
      .eq('status', status)
      .order('last_content_at', { ascending: false })
      .limit(limit)
      .range(offset, offset + limit - 1);

    if (agentId) {
      query = query.eq('agent_id', agentId);
    }

    if (threadType) {
      query = query.eq('thread_type', threadType);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching memory threads:', error);
      return NextResponse.json(
        { error: 'Failed to fetch memory threads' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data || [],
      pagination: {
        total: count || 0,
        limit,
        offset,
      },
    });
  } catch (error) {
    console.error('Error in memory threads API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/memory-threads
 * Create a new memory thread
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description, thread_type, agent_id, parent_thread_id, domain_tags } = body;

    if (!title || !thread_type) {
      return NextResponse.json(
        { error: 'Title and thread_type are required' },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Calculate fork_generation if parent exists
    let fork_generation = 0;
    if (parent_thread_id) {
      const { data: parent } = await supabase
        .from('memory_threads')
        .select('fork_generation')
        .eq('id', parent_thread_id)
        .single();
      if (parent) {
        fork_generation = (parent.fork_generation || 0) + 1;
      }
    }

    const { data, error } = await supabase
      .from('memory_threads')
      .insert({
        title,
        description,
        thread_type,
        agent_id,
        parent_thread_id,
        fork_generation,
        domain_tags: domain_tags || [],
        status: 'active',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating memory thread:', error);
      return NextResponse.json(
        { error: 'Failed to create memory thread' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
    }, {  status: 201, headers: { 'Content-Type': 'application/json; charset=utf-8' } });
  } catch (error) {
    console.error('Error in memory threads API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
