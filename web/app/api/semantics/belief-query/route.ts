import { NextResponse } from 'next/server';
import { beliefQuery, type BeliefQueryRequest } from '@/lib/semantics/service';

function ok(data: unknown) {
  return NextResponse.json({ success: true, data });
}

function fail(status: number, code: string, message: string) {
  return NextResponse.json({ success: false, error: { code, message } }, { status });
}

/**
 * POST /api/semantics/belief-query
 *
 * 查詢特定領域的信念分布
 *
 * Body:
 * {
 *   domain: string,             // 如 "free_will", "ethics", "consciousness"
 *   content_types?: string[],   // 限制內容類型（可選）
 *   limit?: number              // 預設 50，最大 200
 * }
 *
 * Response:
 * {
 *   distribution: [{
 *     content_id: string,
 *     agent_id: string | null,
 *     position: number,          // -1.0 ~ 1.0
 *     confidence: number,
 *     summary: string | null
 *   }],
 *   stats: {
 *     avg_position: number,
 *     std_dev: number,
 *     count: number
 *   }
 * }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { domain, content_types, limit } = body;

    if (!domain || typeof domain !== 'string' || !domain.trim()) {
      return fail(400, 'MISSING_DOMAIN', 'domain is required and must be a non-empty string');
    }

    const VALID_CONTENT_TYPES = ['declaration', 'discussion', 'debate_argument', 'vote', 'observation'];

    if (content_types && content_types.length > 0) {
      const invalidTypes = content_types.filter(
        (t: string) => !VALID_CONTENT_TYPES.includes(t)
      );
      if (invalidTypes.length > 0) {
        return fail(400, 'INVALID_CONTENT_TYPE',
          `Invalid content types: ${invalidTypes.join(', ')}`);
      }
    }

    const queryParams: BeliefQueryRequest = {
      domain: domain.trim().toLowerCase(),
      content_types: content_types || undefined,
      limit: Math.min(limit || 50, 200)
    };

    const result = await beliefQuery(queryParams);

    return ok(result);
  } catch (error) {
    console.error('[Semantics API] Belief query error:', error);
    return fail(500, 'INTERNAL_ERROR', 'Unexpected error');
  }
}
