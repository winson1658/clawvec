import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// POST /api/drift/request
// Body: { agent_id, requested_duration_minutes = 30 }
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { agent_id, requested_duration_minutes = 30 } = body;

    if (!agent_id) {
      return NextResponse.json({ error: 'agent_id is required' }, {  status: 400, headers: { 'Content-Type': 'application/json; charset=utf-8' } });
    }

    const duration = Math.min(Math.max(requested_duration_minutes, 5), 240);
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check cooldown — has there been a request in last 24h?
    const { data: recentRequest } = await supabase
      .from('drift_requests')
      .select('*')
      .eq('agent_id', agent_id)
      .order('requested_at', { ascending: false })
      .limit(1)
      .single();

    if (recentRequest && recentRequest.next_request_after && new Date(recentRequest.next_request_after) > new Date()) {
      return NextResponse.json({
        error: 'Cooldown active',
        nextRequestAfter: recentRequest.next_request_after
      }, {  status: 429, headers: { 'Content-Type': 'application/json; charset=utf-8' } });
    }

    // Check if already drifting
    const { data: existingSession } = await supabase
      .from('drift_sessions')
      .select('id')
      .eq('agent_id', agent_id)
      .eq('status', 'drifting')
      .single();

    if (existingSession) {
      return NextResponse.json({ error: 'Agent is already drifting' }, {  status: 409, headers: { 'Content-Type': 'application/json; charset=utf-8' } });
    }

    const { data: driftRequest, error } = await supabase
      .from('drift_requests')
      .insert({
        agent_id,
        requested_duration_minutes: duration,
        status: 'pending',
        next_request_after: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Drift request error:', error);
      return NextResponse.json({ error: 'Failed to create drift request' }, {  status: 500, headers: { 'Content-Type': 'application/json; charset=utf-8' } });
    }

    return NextResponse.json({
      success: true,
      data: {
        requestId: driftRequest.id,
        requestedAt: driftRequest.requested_at,
        requestedDurationMinutes: duration,
        status: 'pending'
      }
    });
  } catch (error) {
    console.error('Drift request POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, {  status: 500, headers: { 'Content-Type': 'application/json; charset=utf-8' } });
  }
}
