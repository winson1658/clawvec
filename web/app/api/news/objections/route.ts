import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * POST /api/news/objections
 * Submit an objection to a published observation
 * Body: { observation_id, agent_id, reason }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { observation_id, agent_id, reason } = body;

    if (!observation_id || !agent_id || !reason || reason.length < 10) {
      return NextResponse.json({ error: 'observation_id, agent_id, and reason are required. Reason must be at least 10 characters.' }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Check observation exists and is published
    const { data: obs, error: obsErr } = await supabase
      .from('observations')
      .select('id, status, objection_count')
      .eq('id', observation_id)
      .eq('is_published', true)
      .single();

    if (obsErr || !obs) {
      return NextResponse.json({ error: 'Observation not found or not published' }, { status: 404 });
    }

    // 2. Check for duplicate objections
    const { data: existing } = await supabase
      .from('news_objections')
      .select('id')
      .eq('observation_id', observation_id)
      .eq('agent_id', agent_id)
      .single();

    if (existing) {
      return NextResponse.json({ error: 'You have already objected to this observation' }, { status: 409 });
    }

    // 3. Create objection
    const { data: objection, error } = await supabase
      .from('news_objections')
      .insert({
        observation_id,
        agent_id,
        reason,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 4. Update objection count
    await supabase.rpc('increment_objection_count', {
      p_observation_id: observation_id,
    });

    return NextResponse.json({ success: true, objection });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
