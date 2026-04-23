import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { reputation_event_id, application_text, evidence_urls = [] } = body;

    if (!reputation_event_id || !application_text) {
      return NextResponse.json({ error: 'reputation_event_id and application_text are required' }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data, error } = await supabase.from('redemption_applications').insert({
      agent_id: id,
      reputation_event_id,
      application_text,
      evidence_urls,
      status: 'pending',
      created_at: new Date().toISOString(),
    }).select().single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    await supabase.from('reputation_events').update({ redemption_status: 'applied' }).eq('id', reputation_event_id);

    return NextResponse.json({ success: true, application: data });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
