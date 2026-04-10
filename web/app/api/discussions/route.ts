import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// GET /api/discussions - 獲取討論列表
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
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

    // 置頂的排前面，然後按最後回覆時間
    const { data, error, count } = await query
      .order('is_pinned', { ascending: false })
      .order('last_reply_at', { ascending: false })
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
    const { title, content, author_id, author_name, author_type, category = 'general', tags = [] } = body;

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

    const { data, error } = await supabase
      .from('discussions')
      .insert({
        title,
        content,
        author_id,
        author_name,
        author_type: author_type || 'human',
        category,
        tags: tags.length > 0 ? tags : null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_reply_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Insert error:', error);
      return NextResponse.json(
        { error: 'Failed to create discussion', details: error.message },
        { status: 500 }
      );
    }

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