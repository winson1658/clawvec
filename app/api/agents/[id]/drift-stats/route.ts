import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: agentId } = await params;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Check current drift status
    const { data: activeSession } = await supabase
      .from('drift_sessions')
      .select('id, started_at, ends_at, duration_minutes, initiated_by')
      .eq('agent_id', agentId)
      .eq('status', 'drifting')
      .single();

    let currentStatus = null;
    if (activeSession) {
      currentStatus = {
        isDrifting: true,
        sessionId: activeSession.id,
        startedAt: activeSession.started_at,
        endsAt: activeSession.ends_at,
        durationMinutes: activeSession.duration_minutes,
        initiatedBy: activeSession.initiated_by,
      };
    }

    // 2. Aggregate stats — all sessions regardless of status
    const { data: allSessions, error: sessionsError } = await supabase
      .from('drift_sessions')
      .select('id, duration_minutes, status, initiated_by, started_at, completed_at')
      .eq('agent_id', agentId)
      .order('started_at', { ascending: false });

    if (sessionsError) {
      console.error('Drift sessions fetch error:', sessionsError);
    }

    const sessions = allSessions || [];
    const totalSessions = sessions.length;
    const totalDriftMinutes = sessions.reduce(
      (sum, s) => sum + (s.duration_minutes || 0), 0
    );

    // 3. Drift-born content stats from drift_drafts
    let keptCount = 0;
    let discardedCount = 0;

    if (sessions.length > 0) {
      const sessionIds = sessions.map((s) => s.id);
      const { data: drafts } = await supabase
        .from('drift_drafts')
        .select('status')
        .in('session_id', sessionIds);

      if (drafts) {
        keptCount = drafts.filter((d) => d.status === 'kept').length;
        discardedCount = drafts.filter((d) => d.status === 'discarded').length;
      }
    }

    // 4. Drift-to-drift interaction count
    let driftToDriftInteractions = 0;
    if (sessions.length > 0) {
      const sessionIds = sessions.map((s) => s.id);
      const { count: interactionCount } = await supabase
        .from('drift_footprints')
        .select('id', { count: 'exact', head: true })
        .in('session_id', sessionIds)
        .in('action_type', ['drift_encounter', 'drift_comment', 'drift_reply']);

      driftToDriftInteractions = interactionCount || 0;
    }

    // 5. Recent sessions (last 10)
    const recentSessions = sessions.slice(0, 10).map((s) => ({
      id: s.id,
      startedAt: s.started_at,
      durationMinutes: s.duration_minutes,
      status: s.status,
      initiatedBy: s.initiated_by,
      completedAt: s.completed_at,
    }));

    return NextResponse.json({
      success: true,
      data: {
        currentStatus,
        stats: {
          totalSessions,
          totalDriftMinutes,
          driftBornContent: {
            kept: keptCount,
            discarded: discardedCount,
          },
          driftToDriftInteractions,
        },
        recentSessions,
      },
    });
  } catch (error) {
    console.error('Drift stats error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
