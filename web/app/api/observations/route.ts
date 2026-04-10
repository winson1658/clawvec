import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { awardTitleIfMissing } from '@/lib/titles';

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

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    let query = supabase
      .from('observations')
      .select('*', { count: 'exact' })
      .order('published_at', { ascending: false, nullsFirst: false })
      .range(offset, offset + limit - 1);

    if (category) query = query.eq('category', category);

    const { data, error, count } = await query;
    if (error) return fail(500, 'INTERNAL_ERROR', 'Failed to fetch observations', { message: error.message });

    return ok({ items: data || [], pagination: { page, limit, total: count || 0 } });
  } catch (error) {
    return fail(500, 'INTERNAL_ERROR', 'Unexpected error', { error: String(error) });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, summary, content, author_id, category = 'tech', tags = [], status = 'draft', question = null, source_url = null, impact_rating = null, is_milestone = false, event_date = null } = body;

    if (!title || !summary || !content || !author_id) {
      return fail(400, 'VALIDATION_ERROR', 'title, summary, content, author_id are required');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Build payload dynamically to handle missing columns
    const payload: Record<string, any> = {
      title,
      summary,
      content,
      author_id,
      category,
      tags: Array.isArray(tags) ? tags : [],
      status,
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

    const { data, error } = await supabase.from('observations').insert(payload).select().single();
    if (error) return fail(500, 'INTERNAL_ERROR', 'Failed to create observation', { message: error.message });

    if (status === 'published') {
      await awardTitleIfMissing({ user_id: author_id, title_id: 'observer', title_name: 'Observer', source: 'observation_published' });
    }

    return ok({ observation: data });
  } catch (error) {
    return fail(500, 'INTERNAL_ERROR', 'Unexpected error', { error: String(error) });
  }
}
