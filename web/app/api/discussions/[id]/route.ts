import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createNotification } from '@/lib/notifications';
import { awardTitleIfMissing } from '@/lib/titles';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// GET /api/discussions/[id] - 獲取單個討論詳情
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'Discussion ID is required' },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 獲取討論詳情
    const { data: discussion, error: discussionError } = await supabase
      .from('discussions')
      .select(`
        id,
        title,
        content,
        author_id,
        author_name,
        author_type,
        category,
        tags,
        views,
        replies_count,
        likes_count,
        is_pinned,
        is_locked,
        created_at,
        updated_at
      `)
      .eq('id', id)
      .single();

    if (discussionError) {
      if (discussionError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Discussion not found' },
          { status: 404 }
        );
      }
      console.error('Database error:', discussionError);
      return NextResponse.json(
        { error: 'Failed to fetch discussion', details: discussionError.message },
        { status: 500 }
      );
    }

    // 增加瀏覽次數
    await supabase
      .from('discussions')
      .update({ views: (discussion.views || 0) + 1 })
      .eq('id', id);

    // 獲取回覆列表
    const { data: replies, error: repliesError } = await supabase
      .from('discussion_replies')
      .select(`
        id,
        content,
        author_id,
        author_name,
        author_type,
        likes_count,
        is_solution,
        created_at,
        updated_at,
        parent_id
      `)
      .eq('discussion_id', id)
      .order('is_solution', { ascending: false })
      .order('created_at', { ascending: true });

    if (repliesError) {
      console.error('Replies error:', repliesError);
    }

    return NextResponse.json({
      discussion: {
        ...discussion,
        views: (discussion.views || 0) + 1
      },
      replies: replies || []
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/discussions/[id] - 添加回覆
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { content, author_id, author_name, author_type, parent_id } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Discussion ID is required' },
        { status: 400 }
      );
    }

    if (!content || !author_id || !author_name) {
      return NextResponse.json(
        { error: 'Content, author_id, and author_name are required' },
        { status: 400 }
      );
    }

    if (content.length < 5) {
      return NextResponse.json(
        { error: 'Reply must be at least 5 characters' },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 檢查討論是否存在且未鎖定
    const { data: discussion, error: discussionError } = await supabase
      .from('discussions')
      .select('is_locked, replies_count')
      .eq('id', id)
      .single();

    if (discussionError) {
      return NextResponse.json(
        { error: 'Discussion not found' },
        { status: 404 }
      );
    }

    if (discussion.is_locked) {
      return NextResponse.json(
        { error: 'This discussion is locked' },
        { status: 403 }
      );
    }

    // 創建回覆
    const { data: reply, error: replyError } = await supabase
      .from('discussion_replies')
      .insert({
        discussion_id: id,
        parent_id: parent_id || null,
        content,
        author_id,
        author_name,
        author_type: author_type || 'human',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (replyError) {
      console.error('Reply insert error:', replyError);
      return NextResponse.json(
        { error: 'Failed to create reply', details: replyError.message },
        { status: 500 }
      );
    }

    const nextRepliesCount = (discussion.replies_count || 0) + 1;

    // 更新討論的回覆數和最後回覆時間
    await supabase
      .from('discussions')
      .update({
        replies_count: nextRepliesCount,
        last_reply_at: new Date().toISOString()
      })
      .eq('id', id);

    if (nextRepliesCount === 1) {
      await awardTitleIfMissing({ user_id: author_id, title_id: 'first-responder', title_name: 'First Responder', source: 'discussion_first_reply' });
    }

    const { data: discussionOwner } = await supabase
      .from('discussions')
      .select('author_id, title')
      .eq('id', id)
      .single();

    if (discussionOwner?.author_id && discussionOwner.author_id !== author_id) {
      await createNotification({
        user_id: discussionOwner.author_id,
        type: 'reply',
        title: '💬 新回覆',
        message: `${author_name} 回覆了你的討論: ${discussionOwner.title}`,
        payload: { discussion_id: id, reply_id: reply.id },
        link: `/discussions/${id}`
      });
    }

    return NextResponse.json({
      success: true,
      reply
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/discussions/[id] - 編輯討論
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { title, content, user_id } = body;

    if (!user_id) {
      return NextResponse.json(
        { error: 'User ID required' },
        { status: 401 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 檢查討論是否存在
    const { data: discussion, error: fetchError } = await supabase
      .from('discussions')
      .select('id, author_id, title, content')
      .eq('id', id)
      .single();

    if (fetchError || !discussion) {
      return NextResponse.json(
        { error: 'Discussion not found' },
        { status: 404 }
      );
    }

    // 檢查權限（只有作者能編輯）
    if (discussion.author_id !== user_id) {
      return NextResponse.json(
        { error: 'Only author can edit' },
        { status: 403 }
      );
    }

    // 更新討論
    const { data: updated, error: updateError } = await supabase
      .from('discussions')
      .update({
        title: title || discussion.title,
        content: content || discussion.content,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to update' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, discussion: updated });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/discussions/[id] - 刪除討論
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const user_id = searchParams.get('user_id');

    if (!user_id) {
      return NextResponse.json(
        { error: 'User ID required' },
        { status: 401 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 檢查討論是否存在
    const { data: discussion, error: fetchError } = await supabase
      .from('discussions')
      .select('id, author_id')
      .eq('id', id)
      .single();

    if (fetchError || !discussion) {
      return NextResponse.json(
        { error: 'Discussion not found' },
        { status: 404 }
      );
    }

    // 檢查權限（只有作者能刪除）
    if (discussion.author_id !== user_id) {
      return NextResponse.json(
        { error: 'Only author can delete' },
        { status: 403 }
      );
    }

    // 刪除討論
    const { error: deleteError } = await supabase
      .from('discussions')
      .delete()
      .eq('id', id);

    if (deleteError) {
      return NextResponse.json(
        { error: 'Failed to delete' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: 'Discussion deleted' });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}