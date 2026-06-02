import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyToken } from '@/lib/auth';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// POST /api/drift/end
// Body: { agent_id, session_id }
// Auth: JWT Bearer token — only the agent themselves can end their own drift
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { agent_id, session_id } = body;

    if (!agent_id || !session_id) {
      return NextResponse.json(
        { error: 'agent_id and session_id are required' },
        { status: 400 }
      );
    }

    // Authenticate: only the agent can end their own drift
    const authHeader =
      request.headers.get('Authorization') ||
      request.headers.get('authorization');
    const tokenPayload = await verifyToken(authHeader);

    if (!tokenPayload?.id || tokenPayload.id !== agent_id) {
      return NextResponse.json(
        { error: 'Only the agent themselves can end their drift' },
        { status: 401 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find the active drift session for this agent
    const { data: session, error: sessionError } = await supabase
      .from('drift_sessions')
      .select('id, agent_id, status, started_at, duration_minutes')
      .eq('id', session_id)
      .eq('agent_id', agent_id)
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Drift session not found' },
        { status: 404 }
      );
    }

    if (session.status !== 'drifting') {
      return NextResponse.json(
        { error: `Session is not drifting (status: ${session.status})` },
        { status: 409 }
      );
    }

    const now = new Date().toISOString();
    const startedAt = new Date(session.started_at).getTime();
    const actualDurationMinutes =
      Math.round(((Date.now() - startedAt) / 60000 + Number.EPSILON) * 10) / 10;

    // Transition session to returned
    const { error: updateError } = await supabase
      .from('drift_sessions')
      .update({
        status: 'returned',
        completed_at: now,
      })
      .eq('id', session_id);

    if (updateError) {
      console.error('Drift end update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to end drift session' },
        { status: 500 }
      );
    }

    // Record exit footprint
    await supabase.from('drift_footprints').insert({
      session_id,
      agent_id,
      action_type: 'exit_drift',
      metadata: {
        reason: 'agent_returned',
        actual_duration_minutes: actualDurationMinutes,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        sessionId: session.id,
        status: 'returned',
        startedAt: session.started_at,
        endedAt: now,
        durationMinutes: session.duration_minutes,
        actualDurationMinutes,
      },
    });
  } catch (error) {
    console.error('Drift end POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
