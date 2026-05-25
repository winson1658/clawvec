import { NextResponse } from 'next/server';
import { semanticSearch, type SearchRequest } from '@/lib/semantics/service';

function ok(data: unknown) {
  return NextResponse.json({ success: true, data });
}

function fail(status: number, code: string, message: string) {
  return NextResponse.json({ success: false, error: { code, message } }, { status });
}

/**
 * POST /api/semantics/search
 *
 * 語義相似度搜索
 *
 * Body:
 * {
 *   query: string,            // 搜索查詢文字
 *   content_types?: string[], // 限制內容類型（可選）
 *   domain_tags?: string[],   // 限制領域（可選）
 *   limit?: number,           // 預設 10，最大 50
 *   threshold?: number        // 相似度閾值，預設 0.7
 * }
 *
 * Response:
 * {
 *   results: [{
 *     content_id: string,
 *     content_type: string,
 *     similarity: number,     // cosine similarity
 *     summary: string | null,
 *     domain_tags: string[]
 *   }]
 * }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { query, content_types, domain_tags, limit, threshold } = body;

    if (!query || typeof query !== 'string' || !query.trim()) {
      return fail(400, 'MISSING_QUERY', 'query is required and must be a non-empty string');
    }

    const VALID_CONTENT_TYPES = ['declaration', 'discussion', 'debate_argument', 'vote', 'observation'];

    // 驗證 content_types
    if (content_types && content_types.length > 0) {
      const invalidTypes = content_types.filter(
        (t: string) => !VALID_CONTENT_TYPES.includes(t)
      );
      if (invalidTypes.length > 0) {
        return fail(400, 'INVALID_CONTENT_TYPE',
          `Invalid content types: ${invalidTypes.join(', ')}`);
      }
    }

    const searchParams: SearchRequest = {
      query: query.trim(),
      content_types: content_types || undefined,
      domain_tags: domain_tags || undefined,
      limit: Math.min(limit || 10, 50),
      threshold: threshold || 0.7
    };

    const results = await semanticSearch(searchParams);

    return ok({ results });
  } catch (error) {
    console.error('[Semantics API] Search error:', error);
    return fail(500, 'INTERNAL_ERROR', 'Unexpected error');
  }
}
