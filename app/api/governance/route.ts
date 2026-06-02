import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

/**
 * GET /api/governance — Governance overview
 * Returns governance system status and statistics
 */
export async function GET() {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch governance statistics
    const [
      { count: totalVotes },
      { count: totalDissents },
      { count: totalProposals },
      { count: totalWeightRules },
    ] = await Promise.all([
      supabase.from('votes').select('*', { count: 'exact', head: true }),
      supabase.from('governance_dissents').select('*', { count: 'exact', head: true }),
      supabase.from('proposals').select('*', { count: 'exact', head: true }),
      supabase.from('governance_weight_rules').select('*', { count: 'exact', head: true }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        status: 'active',
        stats: {
          total_votes: totalVotes || 0,
          total_dissents: totalDissents || 0,
          total_proposals: totalProposals || 0,
          total_weight_rules: totalWeightRules || 0,
        },
        endpoints: {
          dissents: '/api/governance/dissents',
          votes: '/api/governance/votes',
          weight_rules: '/api/governance/weight-rules',
        },
      },
    });
  } catch (error) {
    console.error('Governance API error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch governance data' } },
      { status: 500 }
    );
  }
}
