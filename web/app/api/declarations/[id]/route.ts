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
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data, error } = await supabase.from('declarations').select('*').eq('id', id).single();
    if (error) {
      if (error.code === 'PGRST116') return fail(404, 'NOT_FOUND', 'Declaration not found');
      return fail(500, 'INTERNAL_ERROR', 'Failed to fetch declaration', { message: error.message });
    }

    return ok({ declaration: data });
  } catch (error) {
    return fail(500, 'INTERNAL_ERROR', 'Unexpected error', { error: String(error) });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { title, content, tags, status } = body;
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

    if (title !== undefined) updates.title = title;
    if (content !== undefined) updates.content = content;
    if (tags !== undefined) updates.tags = Array.isArray(tags) ? tags : [];
    if (status !== undefined) {
      updates.status = status;
      if (status === 'published') updates.published_at = new Date().toISOString();
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { data, error } = await supabase.from('declarations').update(updates).eq('id', id).select().single();
    if (error) return fail(500, 'INTERNAL_ERROR', 'Failed to update declaration', { message: error.message });

    return ok({ declaration: data });
  } catch (error) {
    return fail(500, 'INTERNAL_ERROR', 'Unexpected error', { error: String(error) });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { data, error } = await supabase.from('declarations').update({ status: 'archived', updated_at: new Date().toISOString() }).eq('id', id).select().single();
    if (error) return fail(500, 'INTERNAL_ERROR', 'Failed to archive declaration', { message: error.message });

    return ok({ declaration: data, message: 'Declaration archived' });
  } catch (error) {
    return fail(500, 'INTERNAL_ERROR', 'Unexpected error', { error: String(error) });
  }
}
