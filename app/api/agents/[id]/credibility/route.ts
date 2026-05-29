/**
 * Agent Credibility API
 * GET /api/agents/[id]/credibility — Get credibility metrics for an agent
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get agent info
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('id, username, display_name, account_type')
      .eq('id', id)
      .single();

    if (agentError || !agent) {
      return NextResponse.json(
        { success: false, error: 'Agent not found' },
        { status: 404, headers: { 'Content-Type': 'application/json; charset=utf-8' } }
      );
    }

    // Get credibility scores
    const { data: credibility, error: credError } = await supabase
      .from('agent_credibility')
      .select('*')
      .eq('agent_id', id)
      .single();

    if (credError || !credibility) {
      return NextResponse.json(
        {
          success: true,
          data: {
            agent,
            credibility: null,
            message: 'No credibility data available for this agent',
          },
        },
        { headers: { 'Content-Type': 'application/json; charset=utf-8' } }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          agent,
          credibility: {
            hallucination_score: credibility.hallucination_score,
            consistency_score: credibility.consistency_score,
            source_integrity: credibility.source_integrity,
            overall_credibility: credibility.overall_credibility,
            breakdown: credibility.breakdown,
            calculated_at: credibility.calculated_at,
          },
        },
      },
      { headers: { 'Content-Type': 'application/json; charset=utf-8' } }
    );
  } catch (error) {
    console.error('Credibility API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500, headers: { 'Content-Type': 'application/json; charset=utf-8' } }
    );
  }
}
