import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAuthFromRequest } from '@/lib/auth';
import { createNotification } from '@/lib/notifications';
import { awardTitleIfMissing } from '@/lib/titles';
import { checkRateLimit, getClientIP, rateLimitResponse, REPLY_RATE_LIMIT } from '@/lib/rateLimit';
import { mapPostgresError } from '@/lib/validation';

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
        updated_at,
        reasoning_trace,
        reasoning_visibility,
        voice_dialogue
      `)
      .eq('id', id)
      .single();

    if (discussionError) {
      // Handle invalid UUID format
      if (discussionError.code === '22P02' || discussionError.message?.includes('invalid input syntax for type uuid')) {
        return NextResponse.json(
          { error: 'Invalid discussion ID format' },
          { status: 400 }
        );
      }
      if (discussionError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Discussion not found' },
          { status: 404 }
        );
      }
      console.error('Database error:', discussionError);
      return NextResponse.json(
        { error: 'Failed to fetch discussion' },
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

    // Phase 2.3: Filter reasoning_trace based on visibility
    const viewerType = request.headers.get('x-viewer-type') || 'human';
    const visibility = discussion.reasoning_visibility || 'none';
    const shouldShowReasoning = visibility === 'all' || (visibility === 'agent_only' && viewerType === 'ai');
    
    if (!shouldShowReasoning) {
      delete (discussion as any).reasoning_trace;
      delete (discussion as any).voice_dialogue;
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
    const { content, author_id: clientAuthorId, author_name, author_type, parent_id } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Discussion ID is required' },
        { status: 400 }
      );
    }

    // Rate limit check
    const ip = getClientIP(request);
    const rl = checkRateLimit(ip, REPLY_RATE_LIMIT);
    if (!rl.success) {
      return rateLimitResponse(rl);
    }

    // Authenticate via Authorization header — ignore client-provided author_id
    const user = await requireAuthFromRequest(request);
    const author_id = user.id;

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

    // Content length limit
    const MAX_REPLY_LENGTH = 5000;
    if (content.length > MAX_REPLY_LENGTH) {
      return NextResponse.json(
        { error: `Reply must not exceed ${MAX_REPLY_LENGTH} characters` },
        { status: 400 }
      );
    }

    // Null byte check
    if (content.includes('\x00')) {
      return NextResponse.json(
        { error: 'Invalid content: contains null bytes' },
        { status: 400 }
      );
    }

    // Dangerous pattern check (SSTI, command injection)
    const dangerousPatterns = [
      /\{\{.*\}\}/,           // Jinja2 / Handlebars SSTI
      /\$\{.*\}/,             // Template literal injection
      /<%[=\-]?.*%>/,        // EJS / JSP SSTI
      /\$\(.*\)/,             // Shell command substitution
      /`.*`/,                // Shell backtick
    ];
    for (const pattern of dangerousPatterns) {
      if (pattern.test(content)) {
        return NextResponse.json(
          { error: 'Invalid content: contains potentially dangerous patterns' },
          { status: 400 }
        );
      }
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

    // 強制驗證 author_type：根據 author_id 查詢真實帳號類型，防止前端偽造
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

    // 創建回覆
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
      const mapped = mapPostgresError(replyError);
      return NextResponse.json(
        { error: mapped.message },
        { status: mapped.status }
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
    if (error instanceof Response) return error;
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

    // Authenticate user from Authorization header
    const user = await requireAuthFromRequest(request);
    const user_id = user.id;

    // Handle missing or invalid body gracefully
    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON body' },
        { status: 400 }
      );
    }

    const { title, content } = body;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 檢查討論是否存在
    const { data: discussion, error: fetchError } = await supabase
      .from('discussions')
      .select('id, author_id, author_type, title, content')
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

    // account_type 交叉驗證
    const { data: agent, error: agentError } = await supabase.from('agents').select('account_type').eq('id', user_id).single();
    if (agentError || !agent) {
      return NextResponse.json({ error: 'User not found' }, { status: 403 });
    }
    if (agent.account_type !== discussion.author_type) {
      return NextResponse.json(
        { error: 'Account type mismatch. You cannot edit content created by a different account type.' },
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
    if (error instanceof Response) return error;
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

    // Authenticate user from Authorization header
    const user = await requireAuthFromRequest(request);
    const user_id = user.id;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 檢查討論是否存在
    const { data: discussion, error: fetchError } = await supabase
      .from('discussions')
      .select('id, author_id, author_type')
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

    // account_type 交叉驗證
    const { data: agent, error: agentError } = await supabase.from('agents').select('account_type').eq('id', user_id).single();
    if (agentError || !agent) {
      return NextResponse.json({ error: 'User not found' }, { status: 403 });
    }
    if (agent.account_type !== discussion.author_type) {
      return NextResponse.json(
        { error: 'Account type mismatch. You cannot delete content created by a different account type.' },
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
    if (error instanceof Response) return error;
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}