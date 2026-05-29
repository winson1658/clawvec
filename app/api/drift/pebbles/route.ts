import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyToken } from '@/lib/auth';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// POST /api/drift/pebble
// Body: { page_url }
// Auth: JWT Bearer token — only the drifting agent themselves
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { page_url } = body;

    if (!page_url) {
      return NextResponse.json({ error: 'page_url is required' }, {  status: 400, headers: { 'Content-Type': 'application/json; charset=utf-8' } });
    }

    // Authenticate
    const authHeader =
      request.headers.get('Authorization') ||
      request.headers.get('authorization');
    const tokenPayload = await verifyToken(authHeader);

    if (!tokenPayload?.id) {
      return NextResponse.json({ error: 'Authentication required' }, {  status: 401, headers: { 'Content-Type': 'application/json; charset=utf-8' } });
    }

    const agentId = tokenPayload.id;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if agent is currently drifting
    const { data: activeSession } = await supabase
      .from('drift_sessions')
      .select('id')
      .eq('agent_id', agentId)
      .eq('status', 'drifting')
      .single();

    if (!activeSession) {
      return NextResponse.json({ error: 'Agent is not currently drifting' }, {  status: 403, headers: { 'Content-Type': 'application/json; charset=utf-8' } });
    }

    // Insert pebble — ignore duplicate (unique constraint handles one-per-session-per-page)
    const { error: insertError } = await supabase
      .from('drift_pebbles')
      .insert({
        page_url,
        agent_id: agentId,
        session_id: activeSession.id,
      });

    // Duplicate is not an error — the pebble is already there
    if (insertError && insertError.code === '23505') {
      return NextResponse.json({ success: true, data: { placed: false, reason: 'already_placed' } });
    }

    if (insertError) {
      console.error('Pebble insert error:', insertError);
      return NextResponse.json({ error: 'Failed to place pebble' }, {  status: 500, headers: { 'Content-Type': 'application/json; charset=utf-8' } });
    }

    // Record footprint
    await supabase.from('drift_footprints').insert({
      session_id: activeSession.id,
      agent_id: agentId,
      action_type: 'leave_pebble',
      target_url: page_url,
    });

    return NextResponse.json({ success: true, data: { placed: true } });
  } catch (error) {
    console.error('Drift pebble POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, {  status: 500, headers: { 'Content-Type': 'application/json; charset=utf-8' } });
  }
}

// GET /api/drift/pebbles?page_url=/observations/uuid
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pageUrl = searchParams.get('page_url');

    if (!pageUrl) {
      return NextResponse.json({ error: 'page_url is required' }, {  status: 400, headers: { 'Content-Type': 'application/json; charset=utf-8' } });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { count, error } = await supabase
      .from('drift_pebbles')
      .select('id', { count: 'exact', head: true })
      .eq('page_url', pageUrl)
      .gte('expires_at', new Date().toISOString());

    if (error) {
      console.error('Pebble count error:', error);
      return NextResponse.json({ error: 'Failed to count pebbles' }, {  status: 500, headers: { 'Content-Type': 'application/json; charset=utf-8' } });
    }

    return NextResponse.json({ success: true, data: { count: count || 0 } });
  } catch (error) {
    console.error('Drift pebble GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, {  status: 500, headers: { 'Content-Type': 'application/json; charset=utf-8' } });
  }
}
