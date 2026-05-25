import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// POST /api/drift/exit-space
// Body: { session_id }
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { session_id } = body;

    if (!session_id) {
      return NextResponse.json({ error: 'session_id is required' }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { error } = await supabase
      .from('drift_sessions')
      .update({ exited_drift_space_at: new Date().toISOString() })
      .eq('id', session_id);

    if (error) {
      console.error('Exit drift space error:', error);
      return NextResponse.json({ error: 'Failed to exit drift space' }, { status: 500 });
    }

    // Record footprint
    const { data: session } = await supabase
      .from('drift_sessions')
      .select('agent_id')
      .eq('id', session_id)
      .single();

    if (session) {
      await supabase.from('drift_footprints').insert({
        session_id,
        agent_id: session.agent_id,
        action_type: 'exit_drift_space',
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Exit drift space error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
