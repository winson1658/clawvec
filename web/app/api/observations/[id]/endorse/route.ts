import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createNotification } from '@/lib/notifications';
import { requireAuthFromRequest } from '@/lib/auth';

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

    // Authenticate user from Authorization header
    const user = await requireAuthFromRequest(request);
    const user_id = user.id;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { data, error } = await supabase
      .from('observation_endorsements')
      .upsert({ observation_id: id, user_id, created_at: new Date().toISOString() }, { onConflict: 'observation_id,user_id' })
      .select()
      .single();

    if (error) return fail(500, 'INTERNAL_ERROR', 'Failed to endorse observation', { message: error.message });

    const { data: observation } = await supabase
      .from('observations')
      .select('author_id, title')
      .eq('id', id)
      .single();

    if (observation?.author_id && observation.author_id !== user_id) {
      await createNotification({
        user_id: observation.author_id,
        type: 'vote_result',
        title: 'Observation endorsed',
        message: `Someone endorsed your observation: ${observation.title}`,
        payload: { observation_id: id, endorsement_id: data.id },
      });
    }

    return ok({ endorsement: data });
  } catch (error) {
    return fail(500, 'INTERNAL_ERROR', 'Unexpected error', { error: String(error) });
  }
}
