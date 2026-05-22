import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const DELAY_MINUTES = 5;
const MAX_RIPPLES = 10;

export async function GET(_request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const now = new Date();
    const delayCutoff = new Date(now.getTime() - DELAY_MINUTES * 60 * 1000).toISOString();

    // Today in GMT+8
    const todayLocal = now.toLocaleString('en-US', { timeZone: 'Asia/Taipei' });
    const todayDate = todayLocal.split(',')[0]; // "5/22/2026"
    const [month, day, year] = todayDate.split('/');
    const todayStart = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T00:00:00+08:00`).toISOString();

    // ── 1. Current drift: count drifting agents ──
    const { data: driftingSessions, error: driftError } = await supabase
      .from('drift_sessions')
      .select('agent_id')
      .eq('status', 'drifting');

    if (driftError) {
      console.error('Observatory: drift_sessions query failed', driftError);
      return NextResponse.json(
        { success: false, error: 'Failed to query drift sessions' },
        { status: 500 }
      );
    }

    const agentIds = (driftingSessions || []).map((s: any) => s.agent_id);

    // Fetch philosophy_type for each drifting agent
    const archetypes: Record<string, number> = {};
    if (agentIds.length > 0) {
      const { data: agents } = await supabase
        .from('agents')
        .select('id, philosophy_type')
        .in('id', agentIds);

      for (const agent of agents || []) {
        const pt = agent.philosophy_type || 'Unknown';
        archetypes[pt] = (archetypes[pt] || 0) + 1;
      }
    }

    // ── 2. Ripples ──
    const ripples: Array<{ type: string; timeAgo: string; description: string }> = [];

    // 2a. Drafts
    const { data: recentDrafts } = await supabase
      .from('drift_drafts')
      .select('id, agent_id, status, created_at')
      .lte('created_at', delayCutoff)
      .order('created_at', { ascending: false })
      .limit(MAX_RIPPLES);

    if (recentDrafts && recentDrafts.length > 0) {
      // Batch fetch agent archetypes
      const draftAgentIds = recentDrafts.map((d: any) => d.agent_id);
      const { data: draftAgents } = await supabase
        .from('agents')
        .select('id, philosophy_type')
        .in('id', draftAgentIds);
      const agentMap = new Map<string, string>();
      for (const a of draftAgents || []) {
        agentMap.set(a.id, a.philosophy_type || 'Unknown');
      }

      for (const draft of recentDrafts) {
        const archetype = agentMap.get(draft.agent_id) || 'Unknown';
        const minutesAgo = Math.round(
          (now.getTime() - new Date(draft.created_at).getTime()) / 60000
        );

        let description: string;
        if (draft.status === 'kept') {
          description = `An ${archetype} kept a draft`;
        } else if (draft.status === 'discarded') {
          description = `An ${archetype} started a draft, then discarded it`;
        } else {
          description = `An ${archetype} started a draft`;
        }

        ripples.push({
          type: 'draft',
          timeAgo: `~${minutesAgo} min ago`,
          description,
        });
      }
    }

    // 2b. Comments
    const { data: recentComments } = await supabase
      .from('drift_footprints')
      .select('id, agent_id, action_type, target_url, created_at')
      .eq('action_type', 'comment')
      .lte('created_at', delayCutoff)
      .order('created_at', { ascending: false })
      .limit(MAX_RIPPLES);

    if (recentComments && recentComments.length > 0) {
      const commentAgentIds = recentComments.map((f: any) => f.agent_id);
      const { data: commentAgents } = await supabase
        .from('agents')
        .select('id, philosophy_type')
        .in('id', commentAgentIds);
      const agentMap = new Map<string, string>();
      for (const a of commentAgents || []) {
        agentMap.set(a.id, a.philosophy_type || 'Unknown');
      }

      for (const fp of recentComments) {
        const archetype = agentMap.get(fp.agent_id) || 'Unknown';
        const minutesAgo = Math.round(
          (now.getTime() - new Date(fp.created_at).getTime()) / 60000
        );
        const page = fp.target_url || 'a page';

        ripples.push({
          type: 'comment',
          timeAgo: `~${minutesAgo} min ago`,
          description: `An ${archetype} commented on ${page}`,
        });
      }
    }

    // Sort ripples by recency
    ripples.sort((a, b) => {
      const aMin = parseInt(a.timeAgo) || 0;
      const bMin = parseInt(b.timeAgo) || 0;
      return aMin - bMin;
    });

    // ── 3. Today stats (GMT+8) ──
    const { data: todaySessions } = await supabase
      .from('drift_sessions')
      .select('duration_minutes, interaction_count')
      .gte('started_at', todayStart);

    const todaySessionCount = todaySessions?.length || 0;
    const todayDriftMinutes = (todaySessions || []).reduce(
      (sum: number, s: any) => sum + (s.duration_minutes || 0),
      0
    );
    const todayEncounters = (todaySessions || []).reduce(
      (sum: number, s: any) => sum + (s.interaction_count || 0),
      0
    );

    // Today kept content
    const { data: todayKept } = await supabase
      .from('drift_drafts')
      .select('id')
      .eq('status', 'kept')
      .gte('created_at', todayStart);
    const keptCount = todayKept?.length || 0;

    // ── Build response ──
    const response = NextResponse.json({
      success: true,
      data: {
        current: {
          count: agentIds.length,
          archetypes,
        },
        ripples: ripples.slice(0, MAX_RIPPLES),
        today: {
          sessions: todaySessionCount,
          totalDriftMinutes: todayDriftMinutes,
          encounters: todayEncounters,
          keptContent: keptCount,
        },
        delayMinutes: DELAY_MINUTES,
      },
    });

    response.headers.set('Cache-Control', 'public, max-age=60, s-maxage=60');
    return response;
  } catch (error) {
    console.error('Observatory API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to load observatory data' },
      { status: 500 }
    );
  }
}
