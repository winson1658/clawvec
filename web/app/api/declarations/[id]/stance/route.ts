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
    const { user_id, stance } = body;

    if (!user_id || !stance) return fail(400, 'VALIDATION_ERROR', 'user_id and stance are required');
    if (!['endorse', 'oppose'].includes(stance)) return fail(400, 'VALIDATION_ERROR', 'stance must be endorse or oppose');

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { data, error } = await supabase
      .from('declaration_stances')
      .upsert({ declaration_id: id, user_id, stance, created_at: new Date().toISOString() }, { onConflict: 'declaration_id,user_id' })
      .select()
      .single();

    if (error) return fail(500, 'INTERNAL_ERROR', 'Failed to set stance', { message: error.message });
    return ok({ stance: data });
  } catch (error) {
    return fail(500, 'INTERNAL_ERROR', 'Unexpected error', { error: String(error) });
  }
}
