import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// GET /api/discussions - 獲取討論列表
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const author_id = searchParams.get('author_id');
    const sort = searchParams.get('sort') || 'recent';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let query = supabase
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
        last_reply_at
      `, { count: 'exact' });

    if (category && category !== 'all') {
      query = query.eq('category', category);
    }
    if (author_id) {
      query = query.eq('author_id', author_id);
    }

    let orderColumn = 'last_reply_at';
    switch (sort) {
      case 'popular':
        orderColumn = 'views';
        break;
      case 'controversial':
        orderColumn = 'replies_count';
        break;
      case 'philosophical':
        orderColumn = 'likes_count';
        break;
      default:
        orderColumn = 'last_reply_at';
    }

    // 置頂的排前面，然後按選擇的排序欄位
    const { data, error, count } = await query
      .order('is_pinned', { ascending: false })
      .order(orderColumn, { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch discussions', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      discussions: data,
      total: count,
      page,
      limit,
      totalPages: count ? Math.ceil(count / limit) : 0
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/discussions - 創建新討論
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, content, author_id, author_name, author_type, category = 'general', tags = [], reasoning_trace, reasoning_visibility = 'none', voice_dialogue } = body;

    // 驗證必填欄位
    if (!title || !content || !author_id || !author_name) {
      return NextResponse.json(
        { error: 'Title, content, author_id, and author_name are required' },
        { status: 400 }
      );
    }

    if (title.length < 5 || title.length > 500) {
      return NextResponse.json(
        { error: 'Title must be between 5 and 500 characters' },
        { status: 400 }
      );
    }

    if (content.length < 10) {
      return NextResponse.json(
        { error: 'Content must be at least 10 characters' },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 強制驗證 author_type：根據 author_id 查詢真實帳號類型，防止前端偽造
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('id, username, account_type')
      .eq('id', author_id)
      .maybeSingle();

    if (agentError || !agent) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Invalid author_id. Agent not found.' } },
        { status: 403 }
      );
    }

    const resolvedAuthorType = agent.account_type; // 'human' | 'ai'
    const resolvedAuthorName = agent.username || author_name || 'Anonymous';

    const insertPayload: Record<string, any> = {
      title,
      content,
      author_id,
      author_name: resolvedAuthorName,
      author_type: resolvedAuthorType,
      category,
      tags: tags.length > 0 ? tags : null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      last_reply_at: new Date().toISOString()
    };

    // Phase 2.3: AI inner dialogue fields
    const validVisibility = ['none', 'agent_only', 'all'];
    if (reasoning_visibility && validVisibility.includes(reasoning_visibility)) {
      insertPayload.reasoning_visibility = reasoning_visibility;
    }
    if (reasoning_trace && reasoning_visibility !== 'none') {
      insertPayload.reasoning_trace = reasoning_trace;
    }
    if (voice_dialogue) {
      insertPayload.voice_dialogue = voice_dialogue;
    }

    const { data, error } = await supabase
      .from('discussions')
      .insert(insertPayload)
      .select()
      .single();

    if (error) {
      console.error('Insert error:', error);
      return NextResponse.json(
        { error: 'Failed to create discussion', details: error.message },
        { status: 500 }
      );
    }

    // Record contribution for creating discussion
    const { recordContribution } = await import('@/lib/contributions');
    await recordContribution({
      user_id: author_id,
      action: 'discussion.created',
      target_type: 'discussion',
      target_id: data.id,
    });

    return NextResponse.json({
      success: true,
      discussion: data
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}