import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

function ok(data: unknown, meta?: unknown) {
  return NextResponse.json({ success: true, data, ...(meta ? { meta } : {}) });
}

function fail(status: number, code: string, message: string, details?: unknown) {
  return NextResponse.json({ success: false, error: { code, message, ...(details ? { details } : {}) } }, { status });
}

const ALLOWED_FORMULAS = ['linear', 'logarithmic', 'sigmoid', 'tiered', 'custom'] as const;

/**
 * GET /api/governance/weight-rules — List all weight rules
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('active_only');
    const domain = searchParams.get('domain');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100);
    const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1);
    const offset = (page - 1) * limit;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    let query = supabase
      .from('vote_weight_rules')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (activeOnly === 'true') query = query.eq('is_active', true);
    if (domain) query = query.eq('domain_category', domain);

    const { data, error, count } = await query;
    if (error) return fail(500, 'INTERNAL_ERROR', 'Failed to fetch weight rules', { message: error.message });

    return ok({ items: data || [], pagination: { page, limit, total: count || 0 } });
  } catch (error) {
    return fail(500, 'INTERNAL_ERROR', 'Unexpected error', { error: String(error) });
  }
}

/**
 * POST /api/governance/weight-rules — Create a new weight rule
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { rule_name, description, domain_category, domain_tags, weight_formula, formula_params, is_active, effective_from, effective_until, reset_on_vote } = body;

    // Validation
    if (!rule_name || !weight_formula) {
      return fail(400, 'VALIDATION_ERROR', 'rule_name and weight_formula are required');
    }
    if (!ALLOWED_FORMULAS.includes(weight_formula)) {
      return fail(400, 'VALIDATION_ERROR', `weight_formula must be one of: ${ALLOWED_FORMULAS.join(', ')}`);
    }
    if (!formula_params || typeof formula_params !== 'object') {
      return fail(400, 'VALIDATION_ERROR', 'formula_params must be a non-empty object');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const payload = {
      rule_name,
      description: description || null,
      domain_category: domain_category || null,
      domain_tags: domain_tags || [],
      weight_formula,
      formula_params,
      is_active: is_active !== undefined ? is_active : true,
      effective_from: effective_from || new Date().toISOString(),
      effective_until: effective_until || null,
      reset_on_vote: reset_on_vote || false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase.from('vote_weight_rules').insert(payload).select().single();
    if (error) {
      if (error.message?.includes('duplicate key')) {
        return fail(409, 'DUPLICATE_RULE', 'A rule with this name already exists');
      }
      return fail(500, 'INTERNAL_ERROR', 'Failed to create weight rule', { message: error.message });
    }

    return ok({ rule: data });
  } catch (error) {
    return fail(500, 'INTERNAL_ERROR', 'Unexpected error', { error: String(error) });
  }
}
