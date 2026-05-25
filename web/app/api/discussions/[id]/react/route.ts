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
    const { user_id, reaction_type } = body;
    if (!user_id || !reaction_type) return fail(400, 'VALIDATION_ERROR', 'user_id and reaction_type are required');

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { data, error } = await supabase
      .from('discussion_reactions')
      .upsert({ target_type: 'discussion', target_id: id, user_id, reaction_type, created_at: new Date().toISOString() }, { onConflict: 'target_type,target_id,user_id,reaction_type' })
      .select();

    if (error) return fail(500, 'INTERNAL_ERROR', 'Failed to react to discussion', { message: error.message });
    return ok({ reactions: data || [] });
  } catch (error) {
    return fail(500, 'INTERNAL_ERROR', 'Unexpected error', { error: String(error) });
  }
}
