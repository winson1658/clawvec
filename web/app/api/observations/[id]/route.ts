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

    const { data, error } = await supabase.from('observations').select('*').eq('id', id).single();
    if (error) {
      if (error.code === 'PGRST116') return fail(404, 'NOT_FOUND', 'Observation not found');
      return fail(500, 'INTERNAL_ERROR', 'Failed to fetch observation', { message: error.message });
    }

    return ok({ observation: data });
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
    const { user_id } = body;

    if (!user_id) return fail(401, 'UNAUTHORIZED', 'User ID required');

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 檢查權限 + account_type 交叉驗證
    const { data: obs, error: fetchError } = await supabase.from('observations').select('author_id, author_type').eq('id', id).single();
    if (fetchError) return fail(404, 'NOT_FOUND', 'Observation not found');
    if (obs.author_id !== user_id) return fail(403, 'FORBIDDEN', 'Only author can edit');

    const { data: agent, error: agentError } = await supabase.from('agents').select('account_type').eq('id', user_id).single();
    if (agentError || !agent) return fail(403, 'FORBIDDEN', 'User not found');
    if (agent.account_type !== obs.author_type) {
      return fail(403, 'FORBIDDEN', 'Account type mismatch. You cannot edit content created by a different account type.');
    }

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

    for (const key of ['title', 'summary', 'content', 'question', 'source_url', 'category', 'impact_rating', 'is_milestone', 'event_date', 'status']) {
      if (body[key] !== undefined) updates[key] = body[key];
    }
    if (body.tags !== undefined) updates.tags = Array.isArray(body.tags) ? body.tags : [];
    if (body.status === 'published') updates.published_at = new Date().toISOString();

    const { data, error } = await supabase.from('observations').update(updates).eq('id', id).select().single();
    if (error) return fail(500, 'INTERNAL_ERROR', 'Failed to update observation', { message: error.message });

    return ok({ observation: data });
  } catch (error) {
    return fail(500, 'INTERNAL_ERROR', 'Unexpected error', { error: String(error) });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const user_id = searchParams.get('user_id');

    if (!user_id) return fail(401, 'UNAUTHORIZED', 'User ID required');

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 檢查權限 + account_type 交叉驗證
    const { data: obs, error: fetchError } = await supabase.from('observations').select('author_id, author_type').eq('id', id).single();
    if (fetchError) return fail(404, 'NOT_FOUND', 'Observation not found');
    if (obs.author_id !== user_id) return fail(403, 'FORBIDDEN', 'Only author can delete');

    const { data: agent, error: agentError } = await supabase.from('agents').select('account_type').eq('id', user_id).single();
    if (agentError || !agent) return fail(403, 'FORBIDDEN', 'User not found');
    if (agent.account_type !== obs.author_type) {
      return fail(403, 'FORBIDDEN', 'Account type mismatch. You cannot delete content created by a different account type.');
    }

    const { data, error } = await supabase.from('observations').update({ status: 'archived', updated_at: new Date().toISOString() }).eq('id', id).select().single();
    if (error) return fail(500, 'INTERNAL_ERROR', 'Failed to archive observation', { message: error.message });

    return ok({ observation: data, message: 'Observation archived' });
  } catch (error) {
    return fail(500, 'INTERNAL_ERROR', 'Unexpected error', { error: String(error) });
  }
}
