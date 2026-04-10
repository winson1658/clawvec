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
 * POST /api/companions/[id]/reject
 * 拒絕夥伴邀請
 * Access: authed
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { user_id } = body;

    if (!user_id) {
      return fail(400, 'VALIDATION_ERROR', 'user_id is required');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: invitation, error: inviteError } = await supabase
      .from('ai_companion_requests')
      .select('*')
      .eq('id', id)
      .single();

    if (inviteError || !invitation) {
      return fail(404, 'NOT_FOUND', 'Invitation not found');
    }

    if (invitation.target_agent_id !== user_id) {
      return fail(403, 'FORBIDDEN', 'Only the invitee can reject');
    }

    if (invitation.status !== 'pending') {
      return fail(409, 'INVALID_STATE', `Invitation is ${invitation.status}`);
    }

    const { data, error } = await supabase
      .from('ai_companion_requests')
      .update({ status: 'rejected' })
      .eq('id', id)
      .select()
      .single();

    if (error) return fail(500, 'INTERNAL_ERROR', 'Failed to reject invitation', { message: error.message });

    await createNotification({
      user_id: invitation.requester_id,
      type: 'companion_status_changed',
      title: 'Companion invitation declined',
      message: 'Your companion invitation was declined.',
      payload: {
        request_id: id,
        companion_transition: 'rejected',
        status: 'rejected'
      },
    });

    return ok({ companion: data });

  } catch (error) {
    return fail(500, 'INTERNAL_ERROR', 'Unexpected error', { error: String(error) });
  }
}
