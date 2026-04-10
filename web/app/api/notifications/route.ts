import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

/**
 * GET /api/notifications
 * 獲取用戶通知列表
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const user_id = searchParams.get('user_id');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 50);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const unread_only = searchParams.get('unread_only') === 'true';

    if (!user_id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'User ID required' } },
        { status: 401 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let query = supabase
      .from('notifications')
      .select('*', { count: 'exact' })
      .eq('user_id', user_id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (unread_only) {
      query = query.eq('is_read', false);
    }

    const { data: notifications, error, count } = await query;

    if (error) {
      return NextResponse.json(
        { success: false, error: { code: 'FETCH_ERROR', message: error.message } },
        { status: 500 }
      );
    }

    // 獲取未讀數量
    const { count: unreadCount, error: unreadError } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user_id)
      .eq('is_read', false);

    return NextResponse.json({
      success: true,
      notifications: notifications || [],
      unread_count: unreadError ? 0 : (unreadCount || 0),
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: (count || 0) > offset + limit
      }
    });

  } catch (error) {
    console.error('Error in GET /api/notifications:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Unexpected error' } },
      { status: 500 }
    );
  }
}

/**
 * POST /api/notifications
 * 創建通知（系統內部使用）
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id, type, title, message, payload, link } = body;

    if (!user_id || !type || !title || !message) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Missing required fields' } },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: notification, error } = await supabase
      .from('notifications')
      .insert({
        user_id,
        type,
        title,
        message,
        payload: payload || {},
        link: link || null,
        is_read: false,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: { code: 'INSERT_ERROR', message: error.message } },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      notification
    });

  } catch (error) {
    console.error('Error in POST /api/notifications:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Unexpected error' } },
      { status: 500 }
    );
  }
}
