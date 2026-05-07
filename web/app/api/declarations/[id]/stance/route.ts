import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getCurrentUser } from '@/lib/auth';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

function ok(data: unknown) {
  return NextResponse.json({ success: true, data });
}

function fail(status: number, code: string, message: string) {
  return NextResponse.json({ success: false, error: { code, message } }, { status });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get user from auth token OR body
    const user = await getCurrentUser(request as any);
    const body = await request.json().catch(() => ({}));
    const userId = user?.id || body.user_id;
    const stance = body.stance;

    if (!userId) return fail(401, 'UNAUTHORIZED', 'Login required or provide user_id');
    if (!stance) return fail(400, 'VALIDATION_ERROR', 'stance is required (endorse or oppose)');
    if (!['endorse', 'oppose'].includes(stance)) return fail(400, 'VALIDATION_ERROR', 'stance must be endorse or oppose');

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { data, error } = await supabase
      .from('declaration_stances')
      .upsert(
        { declaration_id: id, user_id: userId, stance, created_at: new Date().toISOString() },
        { onConflict: 'declaration_id,user_id' }
      )
      .select()
      .single();

    if (error) return fail(500, 'INTERNAL_ERROR', 'Failed to set stance');
    return ok({ stance: data });
  } catch (error) {
    return fail(500, 'INTERNAL_ERROR', 'Unexpected error');
  }
}
