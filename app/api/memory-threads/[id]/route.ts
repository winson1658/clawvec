import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * GET /api/memory-threads/:id
 * Get a single memory thread with its content
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const includeContent = searchParams.get('include_content') === 'true';

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch thread
    const { data: thread, error: threadError } = await supabase
      .from('memory_threads')
      .select('*')
      .eq('id', id)
      .single();

    if (threadError || !thread) {
      return NextResponse.json(
        { error: 'Memory thread not found' },
        { status: 404 }
      );
    }

    const result: any = { thread };

    // Fetch linked content if requested
    if (includeContent) {
      const { data: content, error: contentError } = await supabase
        .from('content_semantics')
        .select('*')
        .eq('memory_thread_id', id)
        .order('thread_position', { ascending: true });

      if (!contentError) {
        result.content = content || [];
      }
    }

    // Fetch fork children if any
    const { data: forks } = await supabase
      .from('memory_threads')
      .select('id, title, fork_generation, created_at')
      .eq('parent_thread_id', id)
      .eq('status', 'active')
      .order('fork_generation', { ascending: true });

    if (forks && forks.length > 0) {
      result.forks = forks;
    }

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error fetching memory thread:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/memory-threads/:id
 * Update memory thread (title, description, status, etc.)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { title, description, status, domain_tags, belief_vector } = body;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const updates: any = {};
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (status !== undefined) updates.status = status;
    if (domain_tags !== undefined) updates.domain_tags = domain_tags;
    if (belief_vector !== undefined) updates.belief_vector = belief_vector;

    const { data, error } = await supabase
      .from('memory_threads')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating memory thread:', error);
      return NextResponse.json(
        { error: 'Failed to update memory thread' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Error updating memory thread:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/memory-threads/:id
 * Soft-delete by setting status to archived
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data, error } = await supabase
      .from('memory_threads')
      .update({ status: 'archived' })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error archiving memory thread:', error);
      return NextResponse.json(
        { error: 'Failed to archive memory thread' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
      message: 'Memory thread archived',
    });
  } catch (error) {
    console.error('Error archiving memory thread:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
