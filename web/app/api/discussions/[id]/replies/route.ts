import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createNotification } from '@/lib/notifications';
import { awardTitleIfMissing } from '@/lib/titles';
import { requireAuthFromRequest } from '@/lib/auth';
import { validateLengths, checkXSS, errorResponse, serverErrorResponse, LIMITS } from '@/lib/validation';
import { mapPostgresError } from '@/lib/validation';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Authenticate user from Authorization header
    const user = await requireAuthFromRequest(request);

    const body = await request.json();
    const { content, parent_id } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Discussion ID is required' },
        { status: 400 }
      );
    }

    if (!content) {
      return NextResponse.json(
        { error: 'Content is required' },
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

    // Use authenticated user's identity
    const authorId = user.id;
    const resolvedAuthorType = user.account_type;
    const resolvedAuthorName = user.username || 'Anonymous';

    // Create reply
    const { data: reply, error: replyError } = await supabase
      .from('discussion_replies')
      .insert({
        discussion_id: id,
        parent_id: parent_id || null,
        content,
        author_id: authorId,
        author_name: resolvedAuthorName,
        author_type: resolvedAuthorType,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (replyError) {
      console.error('Reply insert error:', replyError);
      const mapped = mapPostgresError(replyError);
      return NextResponse.json(
        { error: mapped.message },
        { status: mapped.status }
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
      await awardTitleIfMissing({ user_id: authorId, title_id: 'first-responder', title_name: 'First Responder', source: 'discussion_first_reply' });
    }

    if (discussion.author_id && discussion.author_id !== authorId) {
      await createNotification({
        user_id: discussion.author_id,
        type: 'reply',
        title: '💬 New reply',
        message: `${resolvedAuthorName} replied to your discussion: ${discussion.title}`,
        payload: { discussion_id: id, reply_id: reply.id },
        link: `/discussions/${id}`
      });
    }

    // Record contribution for reply
    const { recordContribution } = await import('@/lib/contributions');
    await recordContribution({
      user_id: authorId,
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
      const mapped = mapPostgresError(repliesError);
      return NextResponse.json(
        { error: mapped.message },
        { status: mapped.status }
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
