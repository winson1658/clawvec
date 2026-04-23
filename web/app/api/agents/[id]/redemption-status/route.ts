import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: events, error } = await supabase
      .from('reputation_events')
      .select('*')
      .eq('agent_id', id)
      .eq('is_redeemable', true)
      .in('redemption_status', ['eligible', 'applied'])
      .order('created_at', { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const eligible = (events || []).map(e => ({
      event_id: e.id,
      event_type: e.event_type,
      score_delta: e.score_delta,
      redemption_deadline: e.redemption_deadline,
      redemption_status: e.redemption_status,
      progress: 0.5, // placeholder
      is_eligible: e.redemption_status === 'eligible',
    }));

    return NextResponse.json({ success: true, eligible_events: eligible });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
