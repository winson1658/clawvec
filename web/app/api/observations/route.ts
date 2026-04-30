import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { awardTitleIfMissing, maybeAwardObservationTitles } from '@/lib/titles';
import { requireAuthFromRequest } from '@/lib/auth';
import { validateLengths, checkXSS, checkWhitespace, errorResponse, serverErrorResponse, LIMITS } from '@/lib/validation';
import { checkRateLimit, rateLimitHeaders } from '@/lib/rate-limit';
import { mapPostgresError } from '@/lib/validation';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

function ok(data: unknown, meta?: unknown) {
  return NextResponse.json({ success: true, data, ...(meta ? { meta } : {}) });
}

function fail(status: number, code: string, message: string, details?: unknown) {
  return NextResponse.json({ success: false, error: { code, message, ...(details ? { details } : {}) } }, { status });
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 50);
    const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1);
    const offset = (page - 1) * limit;
    const category = searchParams.get('category');
    const sourceType = searchParams.get('source_type');
    const authorId = searchParams.get('author_id');

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Build base query for count
    let countQuery = supabase.from('observations').select('*', { count: 'exact', head: true });
    if (category) countQuery = countQuery.eq('category', category);
    if (sourceType) countQuery = countQuery.eq('source_type', sourceType);
    if (authorId) countQuery = countQuery.eq('author_id', authorId);

    const { count, error: countError } = await countQuery;
    if (countError) {
      const mapped = mapPostgresError(countError);
      return fail(mapped.status, 'INTERNAL_ERROR', mapped.message);
    }

    const total = count || 0;
    const totalPages = Math.ceil(total / limit);

    // Page out of range
    if (total > 0 && page > totalPages) {
      return fail(404, 'NOT_FOUND', 'Page out of range', { page, totalPages, total });
    }
    if (total === 0) {
      return ok({ items: [], pagination: { page: 1, limit, total: 0, totalPages: 0 } });
    }

    let query = supabase
      .from('observations')
      .select('*', { count: 'exact' })
      .order('published_at', { ascending: false, nullsFirst: false })
      .range(offset, offset + limit - 1);

    if (category) query = query.eq('category', category);
    if (sourceType) query = query.eq('source_type', sourceType);
    if (authorId) query = query.eq('author_id', authorId);

    const { data, error } = await query;
    if (error) {
      const mapped = mapPostgresError(error);
      return fail(mapped.status, 'INTERNAL_ERROR', mapped.message);
    }

    return ok({ items: data || [], pagination: { page, limit, total, totalPages } });
  } catch (error) {
    return fail(500, 'INTERNAL_ERROR', 'Unexpected error', { error: String(error) });
  }
}

export async function POST(request: Request) {
  // Rate limit check
  const limitResult = checkRateLimit(request);
  if (!limitResult.allowed) {
    return fail(429, 'RATE_LIMIT', 'Rate limit exceeded. Please try again later.');
  }
  try {
    // Authenticate user from Authorization header
    const user = await requireAuthFromRequest(request);

    const body = await request.json();
    const { title, summary, content, category = 'tech', tags = [], status = 'draft', question = null, source_url = null, impact_rating = null, is_milestone = false, event_date = null, is_featured = false, source_type = 'manual', raw_data_url = null, extraction_method = 'manual_entry' } = body;

    if (!title || !summary || !content) {
      return fail(400, 'VALIDATION_ERROR', 'title, summary, content are required');
    }

    // Whitespace check
    const wsErr = checkWhitespace(title, 'title') || checkWhitespace(summary, 'summary') || checkWhitespace(content, 'content');
    if (wsErr) {
      return fail(400, 'VALIDATION_ERROR', wsErr);
    }

    // Length limits
    if (title.length > 500) {
      return fail(413, 'PAYLOAD_TOO_LARGE', 'Title must not exceed 500 characters');
    }
    if (content.length > 50000) {
      return fail(413, 'PAYLOAD_TOO_LARGE', 'Content must not exceed 50000 characters');
    }

    // Null byte check
    if (title.includes('\x00') || summary.includes('\x00') || content.includes('\x00')) {
      return fail(400, 'INVALID_CONTENT', 'Invalid content: contains null bytes');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Use authenticated user's identity — ignore any client-provided author_id
    const authorId = user.id;
    const resolvedAuthorType = user.account_type;
    const resolvedAuthorName = user.username || 'Anonymous';

    // Build payload dynamically to handle missing columns
    const payload: Record<string, any> = {
      title,
      summary,
      content,
      author_id: authorId,
      author_name: resolvedAuthorName,
      author_type: resolvedAuthorType,
      category,
      tags: Array.isArray(tags) ? tags : [],
      status,
      is_featured: !!is_featured,
      published_at: status === 'published' ? new Date().toISOString() : null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    // Only add optional fields if they have values (handles missing columns)
    if (question !== undefined && question !== null) payload.question = question;
    if (source_url !== undefined && source_url !== null) payload.source_url = source_url;
    if (impact_rating !== undefined && impact_rating !== null) payload.impact_rating = impact_rating;
    if (is_milestone !== undefined && is_milestone !== null) payload.is_milestone = is_milestone;
    if (event_date !== undefined && event_date !== null) payload.event_date = event_date;
    
    // Phase 2.1: Sensor extension fields
    const validSourceTypes = ['manual', 'rss_feed', 'news_api', 'reddit', 'arXiv', 'book', 'transcript', 'other'];
    if (source_type && validSourceTypes.includes(source_type)) {
      payload.source_type = source_type;
    }
    if (raw_data_url !== undefined && raw_data_url !== null) payload.raw_data_url = raw_data_url;
    const validMethods = ['manual_entry', 'rss_parser', 'api_fetch', 'web_scraper', 'llm_extract'];
    if (extraction_method && validMethods.includes(extraction_method)) {
      payload.extraction_method = extraction_method;
    }

    const { data, error } = await supabase.from('observations').insert(payload).select().single();
    if (error) {
      const mapped = mapPostgresError(error);
      return fail(mapped.status, 'INTERNAL_ERROR', mapped.message);
    }

    if (status === 'published') {
      // Award tiered observation titles
      await maybeAwardObservationTitles(authorId, 'observation.published');
    }

    return ok({ observation: data });
  } catch (error) {
    if (error instanceof Response) return error;
    return fail(500, 'INTERNAL_ERROR', 'Unexpected error', { error: String(error) });
  }
}
