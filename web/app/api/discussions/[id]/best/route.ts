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

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { reply_id } = body;
    if (!reply_id) return fail(400, 'VALIDATION_ERROR', 'reply_id is required');

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    await supabase.from('discussion_replies').update({ is_solution: false }).eq('discussion_id', id);
    const { data, error } = await supabase.from('discussion_replies').update({ is_solution: true }).eq('discussion_id', id).eq('id', reply_id).select().single();
    if (error) return fail(500, 'INTERNAL_ERROR', 'Failed to mark best reply', { message: error.message });

    return ok({ reply: data });
  } catch (error) {
    return fail(500, 'INTERNAL_ERROR', 'Unexpected error', { error: String(error) });
  }
}
