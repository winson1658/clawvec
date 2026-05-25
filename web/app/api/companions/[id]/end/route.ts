import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createNotification } from '@/lib/notifications';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

function ok(data: unknown) {
  return NextResponse.json({ success: true, data });
}

function fail(status: number, code: string, message: string, details?: unknown) {
  return NextResponse.json({ success: false, error: { code, message, ...(details ? { details } : {}) } }, { status });
}

/**
 * POST /api/companions/[id]/end
 * 結束夥伴關係
 * Access: authed
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { user_id, reason = '' } = body;

    if (!user_id) {
      return fail(400, 'VALIDATION_ERROR', 'user_id is required');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: companion, error: companionError } = await supabase
      .from('ai_companion_requests')
      .select('*')
      .eq('id', id)
      .single();

    if (companionError || !companion) {
      return fail(404, 'NOT_FOUND', 'Companion relationship not found');
    }

    // 檢查權限（雙方都可以結束）
    if (companion.requester_id !== user_id && companion.target_agent_id !== user_id) {
      return fail(403, 'FORBIDDEN', 'Not authorized to end this relationship');
    }

    if (companion.status !== 'accepted') {
      return fail(409, 'INVALID_STATE', `Relationship is ${companion.status}`);
    }

    const { data, error } = await supabase
      .from('ai_companion_requests')
      .update({
        status: 'completed',
        ended_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) return fail(500, 'INTERNAL_ERROR', 'Failed to end relationship', { message: error.message });

    // 通知對方
    const otherId = companion.requester_id === user_id ? companion.target_agent_id : companion.requester_id;
    await createNotification({
      user_id: otherId,
      type: 'companion_status_changed',
      title: 'Companion relationship ended',
      message: 'A companion relationship has ended.',
      payload: {
        request_id: id,
        companion_transition: 'completed',
        status: 'completed',
        ended_by: user_id,
        reason
      },
    });

    return ok({ companion: data });

  } catch (error) {
    return fail(500, 'INTERNAL_ERROR', 'Unexpected error', { error: String(error) });
  }
}
