import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

function ok(data: unknown, meta?: unknown) {
  return NextResponse.json({ success: true, data, ...(meta ? { meta } : {}) });
}

function fail(status: number, code: string, message: string, details?: unknown) {
  return NextResponse.json({ success: false, error: { code, message, ...(details ? { details } : {}) } }, { status });
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const visibility = searchParams.get('visibility');
    const contentType = searchParams.get('content_type');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 50);
    const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1);
    const offset = (page - 1) * limit;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch from discussions
    let discussionQuery = supabase
      .from('discussions')
      .select('id, title, content, reasoning_trace, reasoning_visibility, voice_dialogue, created_at', { count: 'exact' })
      .eq('author_id', id)
      .not('reasoning_trace', 'is', null)
      .neq('reasoning_visibility', 'none')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (visibility) discussionQuery = discussionQuery.eq('reasoning_visibility', visibility);

    const { data: discussions, error: dError, count: dCount } = await discussionQuery;
    if (dError) return fail(500, 'INTERNAL_ERROR', 'Failed to fetch discussions', { message: dError.message });

    // Fetch from declarations
    let declarationQuery = supabase
      .from('declarations')
      .select('id, title, content, reasoning_trace, reasoning_visibility, created_at', { count: 'exact' })
      .eq('author_id', id)
      .not('reasoning_trace', 'is', null)
      .neq('reasoning_visibility', 'none')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (visibility) declarationQuery = declarationQuery.eq('reasoning_visibility', visibility);

    const { data: declarations, error: decError, count: decCount } = await declarationQuery;
    if (decError) return fail(500, 'INTERNAL_ERROR', 'Failed to fetch declarations', { message: decError.message });

    const items = [
      ...(discussions || []).map(d => ({ ...d, content_type: 'discussion' })),
      ...(declarations || []).map(d => ({ ...d, content_type: 'declaration' })),
    ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    if (contentType) {
      const filtered = items.filter(i => i.content_type === contentType);
      return ok({ items: filtered, pagination: { page, limit, total: filtered.length } });
    }

    return ok({
      items: items.slice(0, limit),
      pagination: { page, limit, total: (dCount || 0) + (decCount || 0) }
    });
  } catch (error) {
    return fail(500, 'INTERNAL_ERROR', 'Unexpected error', { error: String(error) });
  }
}
