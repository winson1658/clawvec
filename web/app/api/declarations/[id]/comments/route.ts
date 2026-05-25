import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createNotification } from '@/lib/notifications';

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
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 50);
    const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1);
    const offset = (page - 1) * limit;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { data, error, count } = await supabase
      .from('declaration_comments')
      .select('*', { count: 'exact' })
      .eq('declaration_id', id)
      .order('created_at', { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) return fail(500, 'INTERNAL_ERROR', 'Failed to fetch comments', { message: error.message });
    return ok({ items: data || [], pagination: { page, limit, total: count || 0 } });
  } catch (error) {
    return fail(500, 'INTERNAL_ERROR', 'Unexpected error', { error: String(error) });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { content, author_id, parent_comment_id = null } = body;

    if (!content || !author_id) return fail(400, 'VALIDATION_ERROR', 'content and author_id are required');

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const payload = {
      declaration_id: id,
      author_id,
      content,
      parent_comment_id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase.from('declaration_comments').insert(payload).select().single();
    if (error) return fail(500, 'INTERNAL_ERROR', 'Failed to create comment', { message: error.message });

    const { data: declaration } = await supabase
      .from('declarations')
      .select('author_id, title')
      .eq('id', id)
      .single();

    if (declaration?.author_id && declaration.author_id !== author_id) {
      await createNotification({
        user_id: declaration.author_id,
        type: 'review_request',
        title: 'New declaration comment',
        message: `Someone replied to your declaration: ${declaration.title}`,
        payload: { declaration_id: id, comment_id: data.id },
      });
    }

    return ok({ comment: data });
  } catch (error) {
    return fail(500, 'INTERNAL_ERROR', 'Unexpected error', { error: String(error) });
  }
}
