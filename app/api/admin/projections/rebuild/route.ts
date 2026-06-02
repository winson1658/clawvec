/**
 * Admin API — Rebuild Event Projections
 * POST /api/admin/projections/rebuild
 * Auth: Admin only
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/admin-utils';
import { createClient } from '@supabase/supabase-js';
import { setProjectionStatus, recordRebuild } from '@/lib/events/projection';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export async function POST(request: NextRequest) {
  try {
    // Verify admin
    const adminCheck = verifyAdmin(request);

    if (!adminCheck.valid) {
      return NextResponse.json(
        { success: false, error: adminCheck.error?.message || 'Unauthorized' },
        { status: adminCheck.status || 401, headers: { 'Content-Type': 'application/json; charset=utf-8' } }
      );
    }

    const body = await request.json();
    const projection = body.projection; // 'observations' | 'agents' | 'debates' | 'all'

    if (!projection || !['observations', 'agents', 'debates', 'all'].includes(projection)) {
      return NextResponse.json(
        { success: false, error: 'Invalid projection name' },
        { status: 400, headers: { 'Content-Type': 'application/json; charset=utf-8' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const startTime = Date.now();

    // Mark as rebuilding
    if (projection === 'all') {
      await setProjectionStatus('observations', 'rebuilding');
      await setProjectionStatus('agents', 'rebuilding');
      await setProjectionStatus('debates', 'rebuilding');
    } else {
      await setProjectionStatus(projection, 'rebuilding');
    }

    // Fetch all events for the projection(s)
    let eventTypes: string[] = [];
    if (projection === 'observations' || projection === 'all') {
      eventTypes.push('observation.published', 'observation.forked', 'observation.edited', 'observation.retracted', 'observation.trust_changed');
    }
    if (projection === 'agents' || projection === 'all') {
      eventTypes.push('agent.registered', 'agent.status.changed', 'reputation.updated', 'reputation.decay_applied', 'title.earned');
    }
    if (projection === 'debates' || projection === 'all') {
      eventTypes.push('debate.created', 'debate.argument.created', 'debate.closed');
    }

    const { data: events, error } = await supabase
      .from('events')
      .select('id, event_type, actor_id, actor_type, target_type, target_id, payload, occurred_at, created_at')
      .in('event_type', eventTypes)
      .order('occurred_at', { ascending: true });

    if (error) {
      if (projection === 'all') {
        await setProjectionStatus('observations', 'error', error.message);
        await setProjectionStatus('agents', 'error', error.message);
        await setProjectionStatus('debates', 'error', error.message);
      } else {
        await setProjectionStatus(projection, 'error', error.message);
      }

      return NextResponse.json(
        { success: false, error: 'Failed to fetch events' },
        { status: 500, headers: { 'Content-Type': 'application/json; charset=utf-8' } }
      );
    }

    const eventsProcessed = events?.length ?? 0;

    // For now, just record the rebuild completion
    // Actual projection rebuild logic will be implemented in Phase 2
    if (projection === 'all') {
      await recordRebuild('observations', eventsProcessed);
      await recordRebuild('agents', eventsProcessed);
      await recordRebuild('debates', eventsProcessed);
    } else {
      await recordRebuild(projection, eventsProcessed);
    }

    const durationMs = Date.now() - startTime;

    return NextResponse.json(
      {
        success: true,
        data: {
          projection,
          events_processed: eventsProcessed,
          duration_ms: durationMs,
          status: 'completed',
        },
      },
      { status: 200, headers: { 'Content-Type': 'application/json; charset=utf-8' } }
    );
  } catch {
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500, headers: { 'Content-Type': 'application/json; charset=utf-8' } }
    );
  }
}
