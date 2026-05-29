import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { calculateWeightedVoteResult, calculateVoteWeight, type WeightRule } from '@/lib/voting/weights';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

function ok(data: unknown) {
  return NextResponse.json({ success: true, data });
}

function fail(status: number, code: string, message: string, details?: unknown) {
  return NextResponse.json({ success: false, error: { code, message, ...(details ? { details } : {}) } }, { status });
}

/**
 * POST /api/governance/votes/weighted-result
 * Calculate weighted vote results for a target (debate, declaration, etc.)
 *
 * Body:
 *   target_type: string (e.g., 'debate_side', 'argument')
 *   target_id: string
 *   rule_id?: string (optional — uses active rule if not specified)
 *   domain_tags?: string[] (for domain bonus calculation)
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { target_type, target_id, rule_id, domain_tags } = body;

    if (!target_type || !target_id) {
      return fail(400, 'VALIDATION_ERROR', 'target_type and target_id are required');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Get all votes for this target
    const { data: votes, error: votesError } = await supabase
      .from('votes')
      .select('user_id, vote_value, target_type, target_id')
      .eq('target_type', target_type)
      .eq('target_id', target_id);

    if (votesError) {
      return fail(500, 'INTERNAL_ERROR', 'Failed to fetch votes', { message: votesError.message });
    }

    if (!votes || votes.length === 0) {
      return ok({
        for_weight: 0,
        against_weight: 0,
        abstain_weight: 0,
        total_weight: 0,
        vote_count: 0,
        passed: false,
        distribution: [],
        rule_name: 'none',
        formula_used: 'none',
      });
    }

    // 2. Get the active weight rule
    let rule: WeightRule | null = null;

    if (rule_id) {
      const { data: ruleData } = await supabase
        .from('vote_weight_rules')
        .select('*')
        .eq('id', rule_id)
        .single();
      rule = ruleData as WeightRule | null;
    } else {
      // Get active default rule (no domain filter first)
      const { data: rules } = await supabase
        .from('vote_weight_rules')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1);

      if (rules && rules.length > 0) {
        rule = rules[0] as WeightRule;
      }
    }

    if (!rule) {
      // No active rule — return raw counts
      const forCount = votes.filter((v: any) => v.vote_value === 1).length;
      const againstCount = votes.filter((v: any) => v.vote_value === -1).length;
      const abstainCount = votes.filter((v: any) => v.vote_value !== 1 && v.vote_value !== -1).length;

      return ok({
        for_weight: forCount,
        against_weight: againstCount,
        abstain_weight: abstainCount,
        total_weight: forCount + againstCount + abstainCount,
        vote_count: votes.length,
        passed: forCount > againstCount,
        distribution: votes.map((v: any) => ({
          user_id: v.user_id,
          contribution_score: 0,
          base_weight: 1,
          domain_bonus: 1,
          final_weight: 1,
          vote_value: v.vote_value,
        })),
        rule_name: 'none (equal weight)',
        formula_used: 'equal',
      });
    }

    // 3. Get contribution scores for all voters
    const userIds = [...new Set(votes.map((v: any) => v.user_id))];

    const contributionMap: Record<string, number> = {};
    const domainContributionMap: Record<string, number> = {};

    // Fetch from contribution_logs
    const { data: contributions } = await supabase
      .from('contribution_logs')
      .select('user_id, points')
      .in('user_id', userIds);

    if (contributions) {
      for (const c of contributions) {
        contributionMap[c.user_id] = (contributionMap[c.user_id] || 0) + (c.points || 0);
      }
    }

    // Domain-specific contributions
    if (domain_tags && domain_tags.length > 0) {
      const { data: domainContribs } = await supabase
        .from('contribution_logs')
        .select('user_id, points')
        .in('user_id', userIds)
        .overlaps('tags', domain_tags);

      if (domainContribs) {
        for (const c of domainContribs) {
          domainContributionMap[c.user_id] = (domainContributionMap[c.user_id] || 0) + (c.points || 0);
        }
      }
    }

    // 4. Calculate weighted result
    const result = await calculateWeightedVoteResult(
      votes.map((v: any) => ({
        user_id: v.user_id,
        vote_value: v.vote_value,
        target_type: v.target_type,
        target_id: v.target_id,
      })),
      contributionMap,
      domainContributionMap,
      rule
    );

    return ok(result);
  } catch (error) {
    return fail(500, 'INTERNAL_ERROR', 'Unexpected error', { error: 'Internal server error' });
  }
}
