import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAuthFromRequest } from '@/lib/auth';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

function ok(data: unknown, meta?: unknown) {
  return NextResponse.json({ success: true, data, ...(meta ? { meta } : {}) });
}

function fail(status: number, code: string, message: string, details?: unknown) {
  return NextResponse.json({ success: false, error: { code, message, ...(details ? { details } : {}) } }, { status });
}

/**
 * GET /api/votes
 * 獲取使用者的投票記錄
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const targetType = searchParams.get('target_type');
    const targetId = searchParams.get('target_id');
    const userId = searchParams.get('user_id');

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    let query = supabase.from('votes').select('*');
    
    if (targetType) query = query.eq('target_type', targetType);
    if (targetId) query = query.eq('target_id', targetId);
    if (userId) query = query.eq('user_id', userId);

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) return fail(500, 'INTERNAL_ERROR', 'Failed to fetch votes', { message: error.message });

    return ok({ items: data || [] });
  } catch (error) {
    return fail(500, 'INTERNAL_ERROR', 'Unexpected error', { error: String(error) });
  }
}

/**
 * POST /api/votes
 * 投票（立場票或論點票）
 * Access: authed
 * Action: votes.side | votes.argument
 * Rate limit: debate_side: 10/hour, argument: 200/hour
 * Idempotency: idempotent (upsert)
 */
export async function POST(request: Request) {
  try {
    // L6: Verify authentication first
    let authUser;
    try {
      authUser = await requireAuthFromRequest(request);
    } catch {
      return fail(401, 'UNAUTHORIZED', 'Authentication required');
    }

    const body = await request.json();
    const { target_type, target_id, vote_value, meta = {}, user_id } = body;

    // 驗證必填欄位
    if (!target_type || !target_id || vote_value === undefined || !user_id) {
      return fail(400, 'VALIDATION_ERROR', 'target_type, target_id, vote_value, user_id are required', {
        fields: { target_type: !target_type, target_id: !target_id, vote_value: vote_value === undefined, user_id: !user_id }
      });
    }

    // L6: 驗證 user_id 與 token 中的用戶 ID 匹配
    if (authUser.id !== user_id) {
      return fail(403, 'FORBIDDEN', 'user_id does not match authenticated user');
    }

    // 驗證 target_type
    if (!['debate_side', 'argument'].includes(target_type)) {
      return fail(400, 'VALIDATION_ERROR', 'target_type must be debate_side or argument', {
        received: target_type
      });
    }

    // 驗證 vote_value
    if (![1, -1].includes(vote_value)) {
      return fail(400, 'VALIDATION_ERROR', 'vote_value must be 1 (endorse) or -1 (oppose)', {
        received: vote_value
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 檢查目標是否存在
    if (target_type === 'debate_side') {
      const { data: debate, error: debateError } = await supabase
        .from('debates')
        .select('status, id')
        .eq('id', target_id)
        .single();

      if (debateError || !debate) {
        return fail(404, 'NOT_FOUND', 'Debate not found', { target_id });
      }

      // 辯論必須是 open 或 active 才能投票
      if (!['waiting', 'active'].includes(debate.status)) {
        return fail(409, 'INVALID_STATE', 'Debate is not open for voting', {
          current_status: debate.status
        });
      }
    } else if (target_type === 'argument') {
      const { data: argument, error: argError } = await supabase
        .from('debate_messages')
        .select('id, debate_id')
        .eq('id', target_id)
        .single();

      if (argError || !argument) {
        return fail(404, 'NOT_FOUND', 'Argument not found', { target_id });
      }

      // 檢查所屬辯論狀態
      const { data: debate } = await supabase
        .from('debates')
        .select('status')
        .eq('id', argument.debate_id)
        .single();

      if (debate?.status === 'ended') {
        return fail(409, 'INVALID_STATE', 'Debate has ended', {
          current_status: debate.status
        });
      }
    }

    // Upsert 投票（idempotent）
    const { data: existing } = await supabase
      .from('votes')
      .select('id')
      .eq('user_id', user_id)
      .eq('target_type', target_type)
      .eq('target_id', target_id)
      .maybeSingle();

    let result;
    if (existing) {
      // 更新現有投票
      const { data, error } = await supabase
        .from('votes')
        .update({
          vote_value,
          meta,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) return fail(500, 'INTERNAL_ERROR', 'Failed to update vote', { message: error.message });
      result = data;
    } else {
      // 建立新投票
      const { data, error } = await supabase
        .from('votes')
        .insert({
          user_id,
          target_type,
          target_id,
          vote_value,
          meta,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) return fail(500, 'INTERNAL_ERROR', 'Failed to create vote', { message: error.message });
      result = data;
    }

    // 更新計數
    if (target_type === 'argument') {
      await updateArgumentVoteCounts(supabase, target_id);
    }

    // Record contribution for new vote only (not update)
    if (!existing) {
      const { recordContribution } = await import('@/lib/contributions');
      await recordContribution({
        user_id: user_id,
        action: 'vote.cast',
        target_type: target_type,
        target_id: target_id,
      });
    }

    return ok({ vote: result, is_update: !!existing });

  } catch (error) {
    return fail(500, 'INTERNAL_ERROR', 'Unexpected error', { error: String(error) });
  }
}

/**
 * DELETE /api/votes
 * 取消投票
 */
export async function DELETE(request: Request) {
  try {
    // L6: Verify authentication first
    let authUser;
    try {
      authUser = await requireAuthFromRequest(request);
    } catch {
      return fail(401, 'UNAUTHORIZED', 'Authentication required');
    }

    const { searchParams } = new URL(request.url);
    const targetType = searchParams.get('target_type');
    const targetId = searchParams.get('target_id');
    const userId = searchParams.get('user_id');

    if (!targetType || !targetId || !userId) {
      return fail(400, 'VALIDATION_ERROR', 'target_type, target_id, user_id are required');
    }

    // L6: 驗證 user_id 與 token 中的用戶 ID 匹配
    if (authUser.id !== userId) {
      return fail(403, 'FORBIDDEN', 'user_id does not match authenticated user');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { error } = await supabase
      .from('votes')
      .delete()
      .eq('user_id', userId)
      .eq('target_type', targetType)
      .eq('target_id', targetId);

    if (error) return fail(500, 'INTERNAL_ERROR', 'Failed to delete vote', { message: error.message });

    // 更新計數
    if (targetType === 'argument') {
      await updateArgumentVoteCounts(supabase, targetId);
    }

    return ok({ deleted: true });

  } catch (error) {
    return fail(500, 'INTERNAL_ERROR', 'Unexpected error', { error: String(error) });
  }
}

// 輔助函數：更新論點投票計數
async function updateArgumentVoteCounts(supabase: any, argumentId: string) {
  const { data: votes } = await supabase
    .from('votes')
    .select('vote_value')
    .eq('target_type', 'argument')
    .eq('target_id', argumentId);

  const endorseCount = votes?.filter((v: any) => v.vote_value === 1).length || 0;
  const opposeCount = votes?.filter((v: any) => v.vote_value === -1).length || 0;

  await supabase
    .from('debate_messages')
    .update({ endorse_count: endorseCount, oppose_count: opposeCount })
    .eq('id', argumentId);
}
