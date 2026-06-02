import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

function ok(data: unknown) {
  return NextResponse.json({ success: true, data });
}

function fail(status: number, code: string, message: string, details?: unknown) {
  return NextResponse.json({ success: false, error: { code, message, ...(details ? { details } : {}) } }, { status });
}

/**
 * GET /api/governance/weight-rules/[id] — Get single weight rule
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data, error } = await supabase.from('vote_weight_rules').select('id, name, description, is_active, base_weight, contribution_multiplier, domain_bonus_enabled, domain_bonus_multiplier, min_weight, max_weight, formula_config, created_at, updated_at').eq('id', id).single();
    if (error) {
      if (error.code === 'PGRST116') return fail(404, 'NOT_FOUND', 'Weight rule not found');
      return fail(500, 'INTERNAL_ERROR', 'Failed to fetch weight rule', { message: 'Internal server error' });
    }

    return ok({ rule: data });
  } catch (error) {
    return fail(500, 'INTERNAL_ERROR', 'Unexpected error', { error: 'Internal server error' });
  }
}

/**
 * PATCH /api/governance/weight-rules/[id] — Update weight rule
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { rule_name, description, domain_category, domain_tags, weight_formula, formula_params, is_active, effective_from, effective_until, reset_on_vote } = body;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Validate formula if provided
    const ALLOWED_FORMULAS = ['linear', 'logarithmic', 'sigmoid', 'tiered', 'custom'] as const;
    if (weight_formula && !ALLOWED_FORMULAS.includes(weight_formula)) {
      return fail(400, 'VALIDATION_ERROR', `weight_formula must be one of: ${ALLOWED_FORMULAS.join(', ')}`);
    }

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (rule_name !== undefined) updates.rule_name = rule_name;
    if (description !== undefined) updates.description = description;
    if (domain_category !== undefined) updates.domain_category = domain_category;
    if (domain_tags !== undefined) updates.domain_tags = domain_tags;
    if (weight_formula !== undefined) updates.weight_formula = weight_formula;
    if (formula_params !== undefined) updates.formula_params = formula_params;
    if (is_active !== undefined) updates.is_active = is_active;
    if (effective_from !== undefined) updates.effective_from = effective_from;
    if (effective_until !== undefined) updates.effective_until = effective_until;
    if (reset_on_vote !== undefined) updates.reset_on_vote = reset_on_vote;

    const { data, error } = await supabase.from('vote_weight_rules').update(updates).eq('id', id).select().single();
    if (error) {
      if (error.code === 'PGRST116') return fail(404, 'NOT_FOUND', 'Weight rule not found');
      if (error.message?.includes('duplicate key')) {
        return fail(409, 'DUPLICATE_RULE', 'A rule with this name already exists');
      }
      return fail(500, 'INTERNAL_ERROR', 'Failed to update weight rule', { message: 'Internal server error' });
    }

    return ok({ rule: data });
  } catch (error) {
    return fail(500, 'INTERNAL_ERROR', 'Unexpected error', { error: 'Internal server error' });
  }
}

/**
 * DELETE /api/governance/weight-rules/[id] — Delete weight rule
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { error } = await supabase.from('vote_weight_rules').delete().eq('id', id);
    if (error) {
      if (error.code === 'PGRST116') return fail(404, 'NOT_FOUND', 'Weight rule not found');
      return fail(500, 'INTERNAL_ERROR', 'Failed to delete weight rule', { message: 'Internal server error' });
    }

    return ok({ message: 'Weight rule deleted' });
  } catch (error) {
    return fail(500, 'INTERNAL_ERROR', 'Unexpected error', { error: 'Internal server error' });
  }
}
