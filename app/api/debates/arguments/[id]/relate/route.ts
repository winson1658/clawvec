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

const VALID_RELATIONS = ['supports', 'opposes', 'follows_from', 'contradicts', 'elaborates'] as const;
const VALID_TYPES = ['premise', 'inference', 'counter', 'rebuttal', 'evidence'] as const;

/**
 * POST /api/debates/arguments/[id]/relate
 *
 * 在兩個論證之間建立關係（支援／反對／衍生／矛盾／闡述）
 *
 * Body:
 * {
 *   debate_id: string (UUID),
 *   target_argument_id: string (UUID),
 *   relation_type: 'supports' | 'opposes' | 'follows_from' | 'contradicts' | 'elaborates',
 *   source_argument_type?: string,  // default: inferred
 *   target_argument_type?: string,
 *   confidence?: number,            // 0.0-1.0, default 0.5
 *   explanation?: string
 * }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sourceArgumentId = (await params).id;
    const body = await request.json();

    const { debate_id, target_argument_id, relation_type, source_argument_type, target_argument_type, confidence, explanation } = body;

    // Validation
    if (!debate_id || !target_argument_id || !relation_type) {
      return fail(400, 'MISSING_PARAMS', 'debate_id, target_argument_id, and relation_type are required');
    }

    if (!VALID_RELATIONS.includes(relation_type)) {
      return fail(400, 'INVALID_RELATION', `relation_type must be one of: ${VALID_RELATIONS.join(', ')}`);
    }

    if (source_argument_type && !VALID_TYPES.includes(source_argument_type)) {
      return fail(400, 'INVALID_SOURCE_TYPE', `source_argument_type must be one of: ${VALID_TYPES.join(', ')}`);
    }

    if (target_argument_type && !VALID_TYPES.includes(target_argument_type)) {
      return fail(400, 'INVALID_TARGET_TYPE', `target_argument_type must be one of: ${VALID_TYPES.join(', ')}`);
    }

    if (sourceArgumentId === target_argument_id) {
      return fail(400, 'SELF_RELATION', 'An argument cannot relate to itself');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get source argument type from DB if not provided
    let resolvedSourceType = source_argument_type;
    if (!resolvedSourceType) {
      const { data: srcArg } = await supabase
        .from('debate_arguments')
        .select('argument_structure')
        .eq('id', sourceArgumentId)
        .single();
      resolvedSourceType = (srcArg?.argument_structure as any)?.type || 'inference';
    }

    let resolvedTargetType = target_argument_type;
    if (!resolvedTargetType) {
      const { data: tgtArg } = await supabase
        .from('debate_arguments')
        .select('argument_structure')
        .eq('id', target_argument_id)
        .single();
      resolvedTargetType = (tgtArg?.argument_structure as any)?.type || 'inference';
    }

    const { data, error } = await supabase
      .from('argument_relations')
      .insert({
        debate_id,
        source_argument_id: sourceArgumentId,
        source_argument_type: resolvedSourceType || 'inference',
        target_argument_id,
        target_argument_type: resolvedTargetType || 'inference',
        relation_type,
        confidence: Math.min(Math.max(confidence ?? 0.5, 0), 1),
        explanation: explanation || null
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return fail(409, 'DUPLICATE_RELATION', 'This relation already exists');
      }
      return fail(500, 'DB_ERROR', error.message);
    }

    return ok(data);
  } catch (error: any) {
    console.error('[Relate] Error:', error);
    return fail(500, 'INTERNAL_ERROR', error.message || 'Unexpected error');
  }
}
