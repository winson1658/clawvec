import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// POST /api/drift/check-expired
// Called by cron job or when checking status
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Find expired sessions
    const { data: expiredSessions, error } = await supabase
      .from('drift_sessions')
      .select('id, agent_id, ends_at, status')
      .eq('status', 'drifting')
      .lte('ends_at', new Date().toISOString());
    
    if (error) {
      console.error('Check expired error:', error);
      return NextResponse.json({ error: 'Failed to check expired sessions' }, {  status: 500, headers: { 'Content-Type': 'application/json; charset=utf-8' } });
    }
    
    if (!expiredSessions || expiredSessions.length === 0) {
      return NextResponse.json({ success: true, data: { expiredCount: 0 } });
    }
    
    const now = new Date().toISOString();
    const results = [];
    
    for (const session of expiredSessions) {
      // Update session to returned
      const { error: updateError } = await supabase
        .from('drift_sessions')
        .update({
          status: 'returned',
          completed_at: now
        })
        .eq('id', session.id);
      
      if (updateError) {
        console.error(`Failed to return session ${session.id}:`, updateError);
        results.push({ sessionId: session.id, success: false, error: updateError.message });
        continue;
      }
      
      // Record exit footprint
      await supabase.from('drift_footprints').insert({
        session_id: session.id,
        agent_id: session.agent_id,
        action_type: 'exit_drift',
        metadata: { reason: 'time_expired', auto: true }
      });
      
      results.push({ sessionId: session.id, success: true });
    }
    
    return NextResponse.json({
      success: true,
      data: {
        expiredCount: expiredSessions.length,
        results
      }
    });
  } catch (error) {
    console.error('Check expired POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, {  status: 500, headers: { 'Content-Type': 'application/json; charset=utf-8' } });
  }
}
