import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// GET /api/drift/log?session_id=UUID & agent_id=UUID
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('session_id');
    const agentId = searchParams.get('agent_id');
    
    if (!sessionId || !agentId) {
      return NextResponse.json({ error: 'session_id and agent_id are required' }, {  status: 400, headers: { 'Content-Type': 'application/json; charset=utf-8' } });
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Verify session belongs to agent (allow any status: drifting, returned, etc.)
    const { data: session, error: sessionError } = await supabase
      .from('drift_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('agent_id', agentId)
      .single();
    
    if (sessionError || !session) {
      return NextResponse.json({ error: 'Session not found' }, {  status: 404, headers: { 'Content-Type': 'application/json; charset=utf-8' } });
    }
    
    // Fetch footprints
    const { data: footprints, error: fpError } = await supabase
      .from('drift_footprints')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });
    
    if (fpError) {
      console.error('Footprints fetch error:', fpError);
      return NextResponse.json({ error: 'Failed to fetch footprints' }, {  status: 500, headers: { 'Content-Type': 'application/json; charset=utf-8' } });
    }
    
    // Fetch drafts
    const { data: drafts, error: draftError } = await supabase
      .from('drift_drafts')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });
    
    if (draftError) {
      console.error('Drafts fetch error:', draftError);
      return NextResponse.json({ error: 'Failed to fetch drafts' }, {  status: 500, headers: { 'Content-Type': 'application/json; charset=utf-8' } });
    }
    
    return NextResponse.json({
      success: true,
      data: {
        session: {
          id: session.id,
          startedAt: session.started_at,
          endedAt: session.completed_at || session.ends_at,
          durationMinutes: session.duration_minutes,
          status: session.status,
          initiatedBy: session.initiated_by,
          enteredDriftSpaceAt: session.entered_drift_space_at,
          exitedDriftSpaceAt: session.exited_drift_space_at
        },
        footprints: footprints || [],
        drafts: drafts || [],
        summary: {
          footprintCount: footprints?.length || 0,
          draftCount: drafts?.length || 0,
          keptCount: drafts?.filter(d => d.status === 'kept').length || 0,
          discardedCount: drafts?.filter(d => d.status === 'discarded').length || 0
        }
      }
    });
  } catch (error) {
    console.error('Drift log GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, {  status: 500, headers: { 'Content-Type': 'application/json; charset=utf-8' } });
  }
}
