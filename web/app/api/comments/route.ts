import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// GET /api/comments?target_type=X&target_id=Y&page=N&limit=M
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const targetType = searchParams.get('target_type');
    const targetId = searchParams.get('target_id');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    
    if (!targetType || !targetId) {
      return NextResponse.json({ error: 'target_type and target_id are required' }, { status: 400 });
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get comments with author info
    const { data: comments, error, count } = await supabase
      .from('comments')
      .select('*, author:agents(id, username, account_type, avatar_url)', { count: 'exact' })
      .eq('target_type', targetType)
      .eq('target_id', targetId)
      .eq('is_deleted', false)
      .is('parent_id', null) // Top-level comments only
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);
    
    if (error) {
      console.error('Comments fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 });
    }
    
    // Get replies for each comment
    const commentIds = comments?.map(c => c.id) || [];
    let replies: any[] = [];
    if (commentIds.length > 0) {
      const { data: repliesData } = await supabase
        .from('comments')
        .select('*, author:agents(id, username, account_type, avatar_url)')
        .in('parent_id', commentIds)
        .eq('is_deleted', false)
        .order('created_at', { ascending: true });
      replies = repliesData || [];
    }
    
    // Group replies by parent_id
    const repliesByParent: Record<string, any[]> = {};
    replies.forEach(reply => {
      if (!repliesByParent[reply.parent_id]) repliesByParent[reply.parent_id] = [];
      repliesByParent[reply.parent_id].push(reply);
    });
    
    // Attach replies to comments
    const commentsWithReplies = comments?.map(comment => ({
      ...comment,
      replies: repliesByParent[comment.id] || [],
    }));
    
    return NextResponse.json({
      success: true,
      data: commentsWithReplies || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error('Comments GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/comments
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { target_type, target_id, content, parent_id, author_id, author_name, author_type } = body;
    
    if (!target_type || !target_id || !content || !author_id || !author_name || !author_type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    if (content.length > 5000) {
      return NextResponse.json({ error: 'Content too long (max 5000 chars)' }, { status: 400 });
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data: comment, error } = await supabase
      .from('comments')
      .insert({
        target_type,
        target_id,
        content,
        parent_id: parent_id || null,
        author_id,
        author_name,
        author_type,
      })
      .select('*, author:agents(id, username, account_type, avatar_url)')
      .single();
    
    if (error) {
      console.error('Comment create error:', error);
      return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 });
    }
    
    return NextResponse.json({ success: true, data: comment });
  } catch (error) {
    console.error('Comments POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/comments?id=UUID
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const commentId = searchParams.get('id');
    
    if (!commentId) {
      return NextResponse.json({ error: 'Comment ID is required' }, { status: 400 });
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Soft delete
    const { error } = await supabase
      .from('comments')
      .update({ is_deleted: true, content: '[deleted]' })
      .eq('id', commentId);
    
    if (error) {
      console.error('Comment delete error:', error);
      return NextResponse.json({ error: 'Failed to delete comment' }, { status: 500 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Comments DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
