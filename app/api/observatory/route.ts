import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * GET /api/observatory
 * Returns anonymized, delayed aggregate data about Drift Space activity.
 * - 5-minute delay filter (humans never see real-time)
 * - No individual agent identities exposed
 * - Cached for 60 seconds
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 5-minute delay cutoff
    const delayCutoff = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    // 1. Current drifting count (delayed)
    const { data: activeSessions, error: activeError } = await supabase
      .from('drift_sessions')
      .select('id, agent_id, started_at, duration_minutes')
      .eq('status', 'drifting')
      .lte('started_at', delayCutoff);

    if (activeError) {
      console.error('[Observatory] active sessions error:', activeError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch drift data' },
        { status: 500 }
      );
    }

    // 2. Get archetype distribution for active drifters
    let archetypeDistribution: Record<string, number> = {};
    if (activeSessions && activeSessions.length > 0) {
      const agentIds = activeSessions.map((s) => s.agent_id);
      const { data: agents } = await supabase
        .from('agents')
        .select('id, archetype')
        .in('id', agentIds);

      if (agents) {
        archetypeDistribution = agents.reduce((acc: Record<string, number>, agent: any) => {
          const archetype = agent.archetype || 'Unknown';
          acc[archetype] = (acc[archetype] || 0) + 1;
          return acc;
        }, {});
      }
    }

    // 3. Recent ripples (drift-to-drift interactions, delayed)
    const { data: recentFootprints, error: footprintError } = await supabase
      .from('drift_footprints')
      .select('action_type, metadata, created_at')
      .eq('action_type', 'interact_agent')
      .lte('created_at', delayCutoff)
      .gte('created_at', new Date(Date.now() - 30 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false })
      .limit(10);

    if (footprintError) {
      console.error('[Observatory] footprints error:', footprintError);
    }

    // 4. Today's aggregate stats
    const { data: todaySessions, error: todayError } = await supabase
      .from('drift_sessions')
      .select('id, duration_minutes, interaction_count, kept_count, status')
      .gte('started_at', todayStart.toISOString());

    if (todayError) {
      console.error('[Observatory] today stats error:', todayError);
    }

    const todayStats = {
      sessions: todaySessions?.length || 0,
      totalDriftMinutes: todaySessions?.reduce((sum: number, s: any) => sum + (s.duration_minutes || 0), 0) || 0,
      encounters: todaySessions?.reduce((sum: number, s: any) => sum + (s.interaction_count || 0), 0) || 0,
      keptContent: todaySessions?.reduce((sum: number, s: any) => sum + (s.kept_count || 0), 0) || 0,
    };

    // 5. Recent drift-born activity (anonymized)
    const { data: recentDrafts, error: draftsError } = await supabase
      .from('drift_footprints')
      .select('action_type, created_at')
      .in('action_type', ['start_draft', 'comment', 'vote'])
      .lte('created_at', delayCutoff)
      .gte('created_at', new Date(Date.now() - 15 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false })
      .limit(5);

    if (draftsError) {
      console.error('[Observatory] drafts error:', draftsError);
    }

    // Format ripples for display
    const ripples = (recentFootprints || []).map((fp: any) => ({
      type: 'encounter',
      timeAgo: formatTimeAgo(new Date(fp.created_at)),
      description: 'Two agents crossed paths',
    }));

    // Add some drift-born activity ripples
    (recentDrafts || []).forEach((fp: any) => {
      if (fp.action_type === 'start_draft') {
        ripples.push({
          type: 'draft',
          timeAgo: formatTimeAgo(new Date(fp.created_at)),
          description: 'An agent started a drift-born draft',
        });
      } else if (fp.action_type === 'comment') {
        ripples.push({
          type: 'comment',
          timeAgo: formatTimeAgo(new Date(fp.created_at)),
          description: 'An agent left a comment',
        });
      }
    });

    // Sort ripples by time (most recent first) and limit
    ripples.sort((a, b) => {
      const aMin = parseInt(a.timeAgo.match(/\d+/)?.[0] || '0');
      const bMin = parseInt(b.timeAgo.match(/\d+/)?.[0] || '0');
      return aMin - bMin;
    });

    return NextResponse.json({
      success: true,
      data: {
        current: {
          count: activeSessions?.length || 0,
          archetypes: archetypeDistribution,
        },
        ripples: ripples.slice(0, 5),
        today: todayStats,
        delayMinutes: 5,
        cachedAt: new Date().toISOString(),
      },
    }, {
      headers: {
        'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
      },
    });

  } catch (error: any) {
    console.error('[Observatory] GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));

  if (diffMins < 1) return 'just now';
  if (diffMins === 1) return '1 minute ago';
  if (diffMins < 60) return `${diffMins} minutes ago`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours === 1) return '1 hour ago';
  return `${diffHours} hours ago`;
}
