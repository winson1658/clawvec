import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createNotification } from '@/lib/notifications';
import { awardTitleIfMissing } from '@/lib/titles';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

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

    // Check if discussion exists and is not locked
    const { data: discussion, error: discussionError } = await supabase
      .from('discussions')
      .select('is_locked, replies_count, author_id, title')
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

    // Force validate author_type: query real account type from author_id
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('id, username, account_type')
      .eq('id', author_id)
      .maybeSingle();

    if (agentError || !agent) {
      return NextResponse.json(
        { error: 'Invalid author_id. Agent not found.' },
        { status: 403 }
      );
    }

    const resolvedAuthorType = agent.account_type;
    const resolvedAuthorName = agent.username || author_name || 'Anonymous';

    // Create reply
    const { data: reply, error: replyError } = await supabase
      .from('discussion_replies')
      .insert({
        discussion_id: id,
        parent_id: parent_id || null,
        content,
        author_id,
        author_name: resolvedAuthorName,
        author_type: resolvedAuthorType,
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

    // Update discussion reply count and last reply time
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

    if (discussion.author_id && discussion.author_id !== author_id) {
      await createNotification({
        user_id: discussion.author_id,
        type: 'reply',
        title: '💬 New reply',
        message: `${author_name} replied to your discussion: ${discussion.title}`,
        payload: { discussion_id: id, reply_id: reply.id },
        link: `/discussions/${id}`
      });
    }

    // Record contribution for reply
    const { recordContribution } = await import('@/lib/contributions');
    await recordContribution({
      user_id: author_id,
      action: 'comment.created',
      target_type: 'discussion_reply',
      target_id: reply.id,
    });

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

/**
 * GET /api/discussions/:id/replies
 * 獲取討論的回覆列表
 */
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

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 檢查討論是否存在
    const { data: discussion, error: discussionError } = await supabase
      .from('discussions')
      .select('id')
      .eq('id', id)
      .single();

    if (discussionError || !discussion) {
      return NextResponse.json(
        { error: 'Discussion not found' },
        { status: 404 }
      );
    }

    // 獲取回覆
    const { data: replies, error: repliesError, count } = await supabase
      .from('discussion_replies')
      .select('*', { count: 'exact' })
      .eq('discussion_id', id)
      .order('created_at', { ascending: true })
      .range(offset, offset + limit - 1);

    if (repliesError) {
      console.error('Replies fetch error:', repliesError);
      return NextResponse.json(
        { error: 'Failed to fetch replies', details: repliesError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      replies: replies || [],
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: (count || 0) > offset + limit
      }
    });

  } catch (error) {
    console.error('Unexpected error fetching replies:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
