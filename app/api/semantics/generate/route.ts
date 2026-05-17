import { NextResponse } from 'next/server';
import { generateAndStore, type ContentType } from '@/lib/semantics/service';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').replace(/\\n/g, '');

const VALID_CONTENT_TYPES: ContentType[] = [
  'declaration', 'discussion', 'debate_argument', 'vote', 'observation'
];

function ok(data: unknown) {
  return NextResponse.json({ success: true, data });
}

function fail(status: number, code: string, message: string) {
  return NextResponse.json({ success: false, error: { code, message } }, { status });
}

/**
 * POST /api/semantics/generate
 *
 * 手動觸發語義生成（用於新內容或補償）
 *
 * Body:
 * {
 *   content_type: 'declaration' | 'discussion' | 'debate_argument' | 'vote' | 'observation',
 *   content_id: string (UUID),
 *   text: string (文字內容)
 *   agent_id?: string (optional)
 * }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { content_type, content_id, text, agent_id } = body;

    // 驗證參數
    if (!content_type || !content_id || !text) {
      return fail(400, 'MISSING_PARAMS', 'content_type, content_id, and text are required');
    }

    if (!VALID_CONTENT_TYPES.includes(content_type)) {
      return fail(400, 'INVALID_CONTENT_TYPE',
        `content_type must be one of: ${VALID_CONTENT_TYPES.join(', ')}`);
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(content_id)) {
      return fail(400, 'INVALID_CONTENT_ID', 'content_id must be a valid UUID');
    }

    // 執行語義生成
    const result = await generateAndStore({
      content_type,
      content_id,
      text,
      agent_id
    });

    if (!result) {
      return fail(500, 'GENERATION_FAILED', 'Failed to generate semantics');
    }

    return ok({
      id: result.id,
      content_type: result.content_type,
      content_id: result.content_id,
      confidence_score: result.confidence_score,
      summary: result.summary,
      domain_tags: result.domain_tags,
      belief_vector: result.belief_vector,
      has_embedding: result.embedding !== null,
      extracted_beliefs_count: (result.extracted_beliefs || []).length
    });
  } catch (error) {
    console.error('[Semantics API] Generate error:', error);
    return fail(500, 'INTERNAL_ERROR', 'Unexpected error');
  }
}
