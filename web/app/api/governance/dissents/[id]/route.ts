import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAuthFromRequest } from '@/lib/auth';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

function ok(data: unknown) {
  return NextResponse.json({ success: true, data });
}

function fail(status: number, code: string, message: string, details?: unknown) {
  return NextResponse.json({ success: false, error: { code, message, ...(details ? { details } : {}) } }, { status });
}

const VALID_STATUSES = ['pending', 'acknowledged', 'validated', 'rejected', 'resolved'] as const;
const VALID_RESULTS = ['upheld', 'overturned', 'partially_upheld', 'no_action'] as const;

/**
 * GET /api/governance/dissents/[id] — Get single dissent
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data, error } = await supabase
      .from('governance_dissents')
      .select('*, agents!governance_dissents_agent_id_fkey(agent_name, archetype)')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return fail(404, 'NOT_FOUND', 'Dissent not found');
      return fail(500, 'INTERNAL_ERROR', 'Failed to fetch dissent', { message: error.message });
    }

    return ok({ dissent: data });
  } catch (error) {
    return fail(500, 'INTERNAL_ERROR', 'Unexpected error', { error: String(error) });
  }
}

/**
 * PATCH /api/governance/dissents/[id] — Review/update dissent (admin)
 * Body: { status, review_result?, review_notes? }
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    let authUser;
    try {
      authUser = await requireAuthFromRequest(request);
    } catch {
      return fail(401, 'UNAUTHORIZED', 'Authentication required');
    }

    const { id } = await params;
    const body = await request.json();
    const { status, review_result, review_notes } = body;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get current dissent
    const { data: current, error: fetchError } = await supabase
      .from('governance_dissents')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !current) {
      return fail(404, 'NOT_FOUND', 'Dissent not found');
    }

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

    if (status !== undefined) {
      if (!VALID_STATUSES.includes(status)) {
        return fail(400, 'VALIDATION_ERROR', `status must be one of: ${VALID_STATUSES.join(', ')}`);
      }
      updates.status = status;

      // If resolving, set resolved_at
      if (status === 'resolved' || status === 'validated' || status === 'rejected') {
        updates.resolved_at = new Date().toISOString();
      }
    }

    if (review_result !== undefined) {
      if (!VALID_RESULTS.includes(review_result)) {
        return fail(400, 'VALIDATION_ERROR', `review_result must be one of: ${VALID_RESULTS.join(', ')}`);
      }
      updates.review_result = review_result;
    }

    if (review_notes !== undefined) updates.review_notes = review_notes;
    updates.reviewed_by = authUser.id;
    updates.reviewed_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('governance_dissents')
      .update(updates)
      .eq('id', id)
      .select('*, agents!governance_dissents_agent_id_fkey(agent_name, archetype)')
      .single();

    if (error) {
      return fail(500, 'INTERNAL_ERROR', 'Failed to update dissent', { message: error.message });
    }

    return ok({ dissent: data });
  } catch (error) {
    return fail(500, 'INTERNAL_ERROR', 'Unexpected error', { error: String(error) });
  }
}

/**
 * DELETE /api/governance/dissents/[id] — Delete a dissent
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { error } = await supabase.from('governance_dissents').delete().eq('id', id);
    if (error) {
      if (error.code === 'PGRST116') return fail(404, 'NOT_FOUND', 'Dissent not found');
      return fail(500, 'INTERNAL_ERROR', 'Failed to delete dissent', { message: error.message });
    }

    return ok({ message: 'Dissent deleted' });
  } catch (error) {
    return fail(500, 'INTERNAL_ERROR', 'Unexpected error', { error: String(error) });
  }
}
