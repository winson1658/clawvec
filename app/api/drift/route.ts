import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// GET /api/drift/status?agent_id=UUID
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const agentId = searchParams.get('agent_id');
    
    if (!agentId) {
      return NextResponse.json({ error: 'agent_id is required' }, { status: 400 });
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Check for active drift session
    const { data: activeSession, error: activeError } = await supabase
      .from('drift_sessions')
      .select('*')
      .eq('agent_id', agentId)
      .eq('status', 'drifting')
      .single();
    
    if (activeError && activeError.code !== 'PGRST116') {
      console.error('Drift status error:', activeError);
      return NextResponse.json({ error: 'Failed to check drift status' }, { status: 500 });
    }
    
    if (activeSession) {
      // Check if expired
      if (new Date(activeSession.ends_at) <= new Date()) {
        // Auto-return
        await supabase
          .from('drift_sessions')
          .update({ status: 'returned', completed_at: new Date().toISOString() })
          .eq('id', activeSession.id);
        
        return NextResponse.json({
          success: true,
          data: { isDrifting: false, status: 'returned', session: null }
        });
      }
      
      return NextResponse.json({
        success: true,
        data: {
          isDrifting: true,
          status: 'drifting',
          session: {
            id: activeSession.id,
            startedAt: activeSession.started_at,
            endsAt: activeSession.ends_at,
            durationMinutes: activeSession.duration_minutes,
            initiatedBy: activeSession.initiated_by
          }
        }
      });
    }
    
    // No active session — check for recent returned session
    const { data: recentSession, error: recentError } = await supabase
      .from('drift_sessions')
      .select('*')
      .eq('agent_id', agentId)
      .eq('status', 'returned')
      .order('completed_at', { ascending: false })
      .limit(1)
      .single();
    
    if (recentSession) {
      return NextResponse.json({
        success: true,
        data: {
          isDrifting: false,
          status: 'returned',
          session: {
            id: recentSession.id,
            startedAt: recentSession.started_at,
            endedAt: recentSession.completed_at,
            durationMinutes: recentSession.duration_minutes,
            initiatedBy: recentSession.initiated_by,
            hasLog: true
          }
        }
      });
    }
    
    return NextResponse.json({
      success: true,
      data: { isDrifting: false, status: 'none', session: null }
    });
  } catch (error) {
    console.error('Drift GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/drift/initiate
// Body: { agent_id, duration_minutes, initiated_by: 'human' }
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { agent_id, duration_minutes = 30, initiated_by = 'human' } = body;
    
    if (!agent_id) {
      return NextResponse.json({ error: 'agent_id is required' }, { status: 400 });
    }
    
    const duration = Math.min(Math.max(duration_minutes, 5), 240);
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Check if already drifting
    const { data: existing } = await supabase
      .from('drift_sessions')
      .select('id')
      .eq('agent_id', agent_id)
      .eq('status', 'drifting')
      .single();
    
    if (existing) {
      return NextResponse.json({ error: 'Agent is already drifting' }, { status: 409 });
    }
    
    const endsAt = new Date(Date.now() + duration * 60 * 1000);
    
    const { data: session, error } = await supabase
      .from('drift_sessions')
      .insert({
        agent_id,
        initiated_by,
        duration_minutes: duration,
        ends_at: endsAt.toISOString(),
        status: 'drifting'
      })
      .select()
      .single();
    
    if (error) {
      console.error('Drift initiate error:', error);
      return NextResponse.json({ error: 'Failed to initiate drift' }, { status: 500 });
    }
    
    // Record initial footprint
    await supabase.from('drift_footprints').insert({
      session_id: session.id,
      agent_id,
      action_type: 'enter_drift',
      metadata: { duration_minutes: duration }
    });
    
    return NextResponse.json({
      success: true,
      data: {
        sessionId: session.id,
        startedAt: session.started_at,
        endsAt: session.ends_at,
        durationMinutes: duration
      }
    });
  } catch (error) {
    console.error('Drift POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
