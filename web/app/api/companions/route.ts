import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createNotification } from '@/lib/notifications';
import { maybeAwardCompanionTitlesOnInvite } from '@/lib/titles';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

function ok(data: unknown, meta?: unknown) {
  return NextResponse.json({ success: true, data, ...(meta ? { meta } : {}) });
}

function fail(status: number, code: string, message: string, details?: unknown) {
  return NextResponse.json({ success: false, error: { code, message, ...(details ? { details } : {}) } }, { status });
}

/**
 * GET /api/companions
 * 獲取夥伴列表
 * Access: authed
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    const status = searchParams.get('status');

    if (!userId) {
      return fail(400, 'VALIDATION_ERROR', 'user_id is required');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 查詢作為 requester 或 addressee 的夥伴關係
    let query = supabase
      .from('ai_companion_requests')
      .select(`
        *,
        requester:requester_id(id, username, account_type),
        addressee:target_agent_id(id, username, account_type)
      `)
      .or(`requester_id.eq.${userId},target_agent_id.eq.${userId}`);

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) return fail(500, 'INTERNAL_ERROR', 'Failed to fetch companions', { message: error.message });

    // 格式化回應
    const items = (data || []).map((item: any) => ({
      id: item.id,
      status: item.status,
      message: item.message,
      created_at: item.created_at,
      accepted_at: item.accepted_at,
      ended_at: item.ended_at,
      partner: item.requester_id === userId ? item.addressee : item.requester,
      is_requester: item.requester_id === userId,
    }));

    return ok({ items });

  } catch (error) {
    return fail(500, 'INTERNAL_ERROR', 'Unexpected error', { error: String(error) });
  }
}

/**
 * POST /api/companions
 * 發送夥伴邀請
 * Access: authed
 * Action: companions.request
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { requester_id, target_agent_id, message = '' } = body;

    // 驗證
    if (!requester_id || !target_agent_id) {
      return fail(400, 'VALIDATION_ERROR', 'requester_id and target_agent_id are required');
    }

    if (requester_id === target_agent_id) {
      return fail(400, 'VALIDATION_ERROR', 'Cannot invite yourself');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 檢查目標用戶是否存在
    const { data: targetUser, error: userError } = await supabase
      .from('agents')
      .select('id, username')
      .eq('id', target_agent_id)
      .single();

    if (userError || !targetUser) {
      return fail(404, 'NOT_FOUND', 'Target user not found');
    }

    // 檢查是否已有進行中的邀請或關係
    const { data: existing } = await supabase
      .from('ai_companion_requests')
      .select('id, status')
      .or(`and(requester_id.eq.${requester_id},target_agent_id.eq.${target_agent_id}),and(requester_id.eq.${target_agent_id},target_agent_id.eq.${requester_id})`)
      .in('status', ['pending', 'accepted'])
      .maybeSingle();

    if (existing) {
      if (existing.status === 'pending') {
        return fail(409, 'CONFLICT', 'Invitation already pending', { code: 'ALREADY_PENDING' });
      }
      if (existing.status === 'accepted') {
        return fail(409, 'CONFLICT', 'Already companions', { code: 'ALREADY_COMPANIONS' });
      }
    }

    // 建立邀請
    const { data, error } = await supabase
      .from('ai_companion_requests')
      .insert({
        requester_id,
        target_agent_id,
        message,
        status: 'pending',
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) return fail(500, 'INTERNAL_ERROR', 'Failed to create invitation', { message: error.message });

    // 發送通知給被邀請者
    await createNotification({
      user_id: target_agent_id,
      type: 'companion_invited',
      title: 'New companion invitation',
      message: 'You received a companion invitation.',
      payload: { 
        request_id: data.id, 
        requester_id,
        companion_transition: 'invited'
      },
    });

    // 檢查並授予封號
    await maybeAwardCompanionTitlesOnInvite({
      user_id: requester_id,
      target_agent_id,
      source: 'companion.invite_created'
    });

    return ok({ companion: data });

  } catch (error) {
    return fail(500, 'INTERNAL_ERROR', 'Unexpected error', { error: String(error) });
  }
}
