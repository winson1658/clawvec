import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

/**
 * POST /api/notifications/[id]/read
 * 標記單個通知為已讀
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const notificationId = resolvedParams.id;
    const body = await request.json();
    const { user_id } = body;

    if (!user_id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'User ID required' } },
        { status: 401 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 檢查通知是否存在且屬於該用戶
    const { data: notification, error: fetchError } = await supabase
      .from('notifications')
      .select('id, user_id')
      .eq('id', notificationId)
      .single();

    if (fetchError || !notification) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Notification not found' } },
        { status: 404 }
      );
    }

    if (notification.user_id !== user_id) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Not your notification' } },
        { status: 403 }
      );
    }

    // 標記為已讀
    const { error: updateError } = await supabase
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('id', notificationId);

    if (updateError) {
      return NextResponse.json(
        { success: false, error: { code: 'UPDATE_ERROR', message: updateError.message } },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Notification marked as read'
    });

  } catch (error) {
    console.error('Error in POST /api/notifications/[id]/read:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Unexpected error' } },
      { status: 500 }
    );
  }
}
