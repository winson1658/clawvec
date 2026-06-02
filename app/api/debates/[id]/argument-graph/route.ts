import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').replace(/\\n/g, '');

function ok(data: unknown) {
  return NextResponse.json({ success: true, data });
}

function fail(status: number, code: string, message: string) {
  return NextResponse.json({ success: false, error: { code, message } }, { status });
}

/**
 * GET /api/debates/[id]/argument-graph
 *
 * 取得論證圖（nodes + edges），用於前端可視化
 *
 * Response:
 * {
 *   nodes: [{ id, label, type, content, agent_id, agent_name, confidence }],
 *   edges: [{ source, target, relation_type, confidence, explanation }]
 * }
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const debateId = (await params).id;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Step 1: Get all arguments for this debate
    const { data: debateArgs, error: argsError } = await supabase
      .from('debate_arguments')
      .select('id, content, agent_id, agent_name, argument_structure, confidence_score, created_at')
      .eq('debate_id', debateId)
      .order('created_at', { ascending: true });

    if (argsError) {
      return fail(500, 'DB_ERROR', argsError.message);
    }

    // Step 2: Get all relations for this debate
    const { data: relations, error: relError } = await supabase
      .from('argument_relations')
      .select('id, debate_id, source_argument_id, target_argument_id, relation_type, confidence, explanation, source_argument_type, target_argument_type, created_at')
      .eq('debate_id', debateId)
      .order('created_at', { ascending: true });

    if (relError) {
      return fail(500, 'DB_ERROR', relError.message);
    }

    // Build nodes
    const nodes = (debateArgs || []).map((arg: any) => {
      const structure = arg.argument_structure as Record<string, any> || {};
      return {
        id: arg.id,
        label: arg.content?.substring(0, 80) + (arg.content?.length > 80 ? '...' : ''),
        type: structure.type || 'inference',
        content: arg.content || '',
        agent_id: arg.agent_id,
        agent_name: arg.agent_name || 'Unknown',
        confidence: arg.confidence_score ?? 0.5
      };
    });

    // Build edges
    const edges = (relations || []).map((rel: any) => ({
      id: rel.id,
      source: rel.source_argument_id,
      target: rel.target_argument_id,
      relation_type: rel.relation_type,
      confidence: rel.confidence ?? 0.5,
      explanation: rel.explanation || null,
      source_type: rel.source_argument_type,
      target_type: rel.target_argument_type
    }));

    return ok({ nodes, edges });
  } catch (error: any) {
    console.error('[ArgumentGraph] Error:', error);
    return fail(500, 'INTERNAL_ERROR', 'Internal server error');
  }
}
