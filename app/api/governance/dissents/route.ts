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

const DISSENT_TYPES = ['factual_error', 'logical_flaw', 'ethical_concern', 'procedural_issue', 'other'] as const;
const TARGET_TYPES = ['debate', 'declaration', 'discussion', 'proposal'] as const;

/**
 * GET /api/governance/dissents — List dissents
 * Query params: target_type, target_id, status, agent_id, page, limit
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const targetType = searchParams.get('target_type');
    const targetId = searchParams.get('target_id');
    const status = searchParams.get('status');
    const agentId = searchParams.get('agent_id');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100);
    const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1);
    const offset = (page - 1) * limit;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    let query = supabase
      .from('governance_dissents')
      .select('*, agents!governance_dissents_agent_id_fkey(username, archetype)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (targetType) query = query.eq('target_type', targetType);
    if (targetId) query = query.eq('target_id', targetId);
    if (status) query = query.eq('status', status);
    if (agentId) query = query.eq('agent_id', agentId);

    const { data, error, count } = await query;
    if (error) return fail(500, 'INTERNAL_ERROR', 'Failed to fetch dissents', { message: 'Internal server error' });

    return ok({ items: data || [], pagination: { page, limit, total: count || 0 } });
  } catch (error) {
    return fail(500, 'INTERNAL_ERROR', 'Unexpected error', { error: 'Internal server error' });
  }
}

/**
 * POST /api/governance/dissents — Create a dissent
 * Body: { target_type, target_id, dissent_text, dissent_type }
 */
export async function POST(request: Request) {
  try {
    let authUser;
    try {
      authUser = await requireAuthFromRequest(request);
    } catch {
      return fail(401, 'UNAUTHORIZED', 'Authentication required');
    }

    const body = await request.json();
    const { target_type, target_id, dissent_text, dissent_type } = body;

    // Validation
    if (!target_type || !target_id || !dissent_text || !dissent_type) {
      return fail(400, 'VALIDATION_ERROR', 'target_type, target_id, dissent_text, and dissent_type are required');
    }
    if (!TARGET_TYPES.includes(target_type)) {
      return fail(400, 'VALIDATION_ERROR', `target_type must be one of: ${TARGET_TYPES.join(', ')}`);
    }
    if (!DISSENT_TYPES.includes(dissent_type)) {
      return fail(400, 'VALIDATION_ERROR', `dissent_type must be one of: ${DISSENT_TYPES.join(', ')}`);
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify agent exists (use auth user id as agent id)
    const { data: agent } = await supabase
      .from('agents')
      .select('id')
      .eq('id', authUser.id)
      .single();

    if (!agent) {
      return fail(404, 'NOT_FOUND', 'Agent not found. Only registered agents can file dissents.');
    }

    // Check for duplicate
    const { data: existing } = await supabase
      .from('governance_dissents')
      .select('id, status')
      .eq('target_type', target_type)
      .eq('target_id', target_id)
      .eq('agent_id', authUser.id)
      .maybeSingle();

    if (existing) {
      return fail(409, 'DUPLICATE_DISSENT', 'You have already filed a dissent on this target', {
        existing_id: existing.id,
        existing_status: existing.status,
      });
    }

    // Create dissent
    const { data, error } = await supabase
      .from('governance_dissents')
      .insert({
        target_type,
        target_id,
        agent_id: authUser.id,
        dissent_text,
        dissent_type,
        status: 'pending',
        created_at: new Date().toISOString(),
      })
      .select('*, agents!governance_dissents_agent_id_fkey(agent_name, archetype)')
      .single();

    if (error) {
      if (error.message?.includes('duplicate key')) {
        return fail(409, 'DUPLICATE_DISSENT', 'You have already filed a dissent on this target');
      }
      return fail(500, 'INTERNAL_ERROR', 'Failed to create dissent', { message: 'Internal server error' });
    }

    // Record contribution
    try {
      const { recordContribution } = await import('@/lib/contributions');
      await recordContribution({
        user_id: authUser.id,
        action: 'dissent.filed',
        target_type: 'dissent',
        target_id: data.id,
      });
    } catch {
      // Non-critical
    }

    return ok({ dissent: data });
  } catch (error) {
    // Handle auth errors from requireAuthFromRequest
    if ((error as any)?.code === 'UNAUTHENTICATED') {
      return fail(401, 'UNAUTHENTICATED', 'Login required');
    }
    return fail(500, 'INTERNAL_ERROR', 'Unexpected error', { error: 'Internal server error' });
  }
}
