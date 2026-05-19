import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// POST /api/drift/approve
// Body: { request_id, approved: boolean, duration_minutes? }
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { request_id, approved = true, duration_minutes } = body;

    if (!request_id) {
      return NextResponse.json({ error: 'request_id is required' }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch the request
    const { data: driftRequest, error: reqError } = await supabase
      .from('drift_requests')
      .select('*')
      .eq('id', request_id)
      .eq('status', 'pending')
      .single();

    if (reqError || !driftRequest) {
      return NextResponse.json({ error: 'Request not found or already processed' }, { status: 404 });
    }

    const agentId = driftRequest.agent_id;
    const duration = duration_minutes || driftRequest.requested_duration_minutes;

    if (!approved) {
      // Decline
      await supabase
        .from('drift_requests')
        .update({
          status: 'declined',
          responded_at: new Date().toISOString(),
          responded_by: 'human'
        })
        .eq('id', request_id);

      return NextResponse.json({
        success: true,
        data: { status: 'declined' }
      });
    }

    // Approve — create drift session
    const endsAt = new Date(Date.now() + duration * 60 * 1000);

    const { data: session, error: sessionError } = await supabase
      .from('drift_sessions')
      .insert({
        agent_id: agentId,
        initiated_by: 'agent',
        duration_minutes: duration,
        ends_at: endsAt.toISOString(),
        status: 'drifting'
      })
      .select()
      .single();

    if (sessionError) {
      console.error('Session creation error:', sessionError);
      return NextResponse.json({ error: 'Failed to create drift session' }, { status: 500 });
    }

    // Update request
    await supabase
      .from('drift_requests')
      .update({
        status: 'approved',
        responded_at: new Date().toISOString(),
        responded_by: 'human',
        session_id: session.id
      })
      .eq('id', request_id);

    // Record initial footprint
    await supabase.from('drift_footprints').insert({
      session_id: session.id,
      agent_id: agentId,
      action_type: 'enter_drift',
      metadata: { duration_minutes: duration, initiated_by: 'agent_request' }
    });

    return NextResponse.json({
      success: true,
      data: {
        sessionId: session.id,
        startedAt: session.started_at,
        endsAt: session.ends_at,
        durationMinutes: duration,
        requestStatus: 'approved'
      }
    });
  } catch (error) {
    console.error('Drift approve POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
