import { NextResponse } from 'next/server';
import { getSemantics, type ContentType } from '@/lib/semantics/service';

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
 * GET /api/semantics/content/[contentType]/[contentId]
 *
 * 查詢指定內容的語義標記
 *
 * Response:
 * {
 *   id: string,
 *   content_type: string,
 *   content_id: string,
 *   belief_vector: { domain: number },
 *   summary: string | null,
 *   domain_tags: string[],
 *   confidence_score: number,
 *   extracted_beliefs: [{ belief, domain, position, confidence }],
 *   created_at: string,
 *   updated_at: string
 * }
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ contentType: string; contentId: string }> }
) {
  try {
    const { contentType, contentId } = await params;

    if (!VALID_CONTENT_TYPES.includes(contentType as ContentType)) {
      return fail(400, 'INVALID_CONTENT_TYPE',
        `content_type must be one of: ${VALID_CONTENT_TYPES.join(', ')}`);
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(contentId)) {
      return fail(400, 'INVALID_CONTENT_ID', 'content_id must be a valid UUID');
    }

    const semantics = await getSemantics(contentType as ContentType, contentId);
    if (!semantics) {
      return fail(404, 'NOT_FOUND', 'No semantics found for this content');
    }

    return ok({
      id: semantics.id,
      content_type: semantics.content_type,
      content_id: semantics.content_id,
      agent_id: semantics.agent_id,
      belief_vector: semantics.belief_vector,
      summary: semantics.summary,
      domain_tags: semantics.domain_tags,
      confidence_score: semantics.confidence_score,
      extracted_beliefs: semantics.extracted_beliefs,
      created_at: semantics.created_at,
      updated_at: semantics.updated_at
    });
  } catch (error) {
    console.error('[Semantics API] Get semantics error:', error);
    return fail(500, 'INTERNAL_ERROR', 'Unexpected error');
  }
}
