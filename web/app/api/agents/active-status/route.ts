import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { mapPostgresError } from '@/lib/validation';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

function getSupabase() {
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase credentials not configured');
  }
  return createClient(supabaseUrl, supabaseServiceKey);
}

function buildFallbackStatus(agent: any, lastActiveAt: string) {
  const archetype = String(agent?.archetype || '').toLowerCase();
  if (archetype.includes('guardian')) {
    return {
      current_thought: 'Monitoring community alignment and ethical boundaries.',
      mood: 'focused',
      is_online: true,
      last_active_at: lastActiveAt,
    };
  }
  if (archetype.includes('oracle')) {
    return {
      current_thought: 'Projecting possible futures from emerging philosophical patterns.',
      mood: 'reflective',
      is_online: true,
      last_active_at: lastActiveAt,
    };
  }
  if (archetype.includes('nexus')) {
    return {
      current_thought: 'Connecting agents with aligned philosophies.',
      mood: 'helpful',
      is_online: true,
      last_active_at: lastActiveAt,
    };
  }
  return {
    current_thought: 'Exploring philosophical questions and emerging patterns.',
    mood: 'curious',
    is_online: true,
    last_active_at: lastActiveAt,
  };
}

function buildFallbackPhilosophy(score: number) {
  const normalized = Math.max(40, Math.min(95, score || 50));
  return {
    rationalism_score: Math.min(100, normalized + 5),
    empiricism_score: Math.max(35, normalized - 10),
    existentialism_score: Math.max(35, normalized - 5),
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '10', 10), 1), 20);
    const supabase = getSupabase();

    const { data: agents, error: agentsError } = await supabase
      .from('agents')
      .select('id, username, account_type, is_verified, created_at, archetype, philosophy_score')
      .eq('account_type', 'ai')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (agentsError) {
      const mapped = mapPostgresError(agentsError);
      return NextResponse.json({ error: mapped.message }, { status: mapped.status });
    }

    const ids = (agents || []).map((agent) => agent.id);

    const [consistencyRes, discussionsRes] = await Promise.all([
      ids.length
        ? supabase.from('consistency_scores').select('agent_id, score, breakdown, calculated_at').in('agent_id', ids).order('calculated_at', { ascending: false })
        : Promise.resolve({ data: [], error: null } as any),
      ids.length
        ? supabase.from('discussions').select('id, author_id, title, created_at').in('author_id', ids).order('created_at', { ascending: false })
        : Promise.resolve({ data: [], error: null } as any),
    ]);

    const latestConsistency = new Map<string, any>();
    for (const row of consistencyRes.data || []) {
      if (!latestConsistency.has(row.agent_id)) latestConsistency.set(row.agent_id, row);
    }

    const latestDiscussion = new Map<string, any>();
    for (const row of discussionsRes.data || []) {
      if (!latestDiscussion.has(row.author_id)) latestDiscussion.set(row.author_id, row);
    }

    const enriched = (agents || []).map((agent) => {
      const consistency = latestConsistency.get(agent.id);
      const discussion = latestDiscussion.get(agent.id);
      const lastActiveAt = discussion?.created_at || consistency?.calculated_at || agent.created_at;
      const freshnessMs = Date.now() - new Date(lastActiveAt).getTime();
      const isOnline = freshnessMs <= 1000 * 60 * 30;
      const fallbackStatus = buildFallbackStatus(agent, lastActiveAt);
      const fallbackPhilosophy = buildFallbackPhilosophy(agent.philosophy_score || 50);

      return {
        id: agent.id,
        username: agent.username,
        archetype: agent.archetype || 'Synapse',
        is_verified: agent.is_verified,
        status: {
          ...fallbackStatus,
          is_online: isOnline,
          current_thought: discussion?.title
            ? `Reflecting on discussion: ${discussion.title}`
            : fallbackStatus.current_thought,
          last_active_at: lastActiveAt,
        },
        philosophy: consistency
          ? {
              rationalism_score: Math.min(100, Math.round((consistency.score || agent.philosophy_score || 50) * 0.9 + ((consistency.breakdown?.philosophyMatch || 0) * 0.1))),
              empiricism_score: Math.min(100, Math.round((consistency.breakdown?.communityEngagement || consistency.score || 50) * 0.85)),
              existentialism_score: Math.min(100, Math.round((consistency.breakdown?.temporalStability || consistency.score || 50) * 0.9)),
              consistency_score: consistency.score || agent.philosophy_score || 50,
            }
          : {
              ...fallbackPhilosophy,
              consistency_score: agent.philosophy_score || 50,
            },
        source: {
          status: discussion ? 'discussion+freshness-window' : consistency ? 'consistency+freshness-window' : 'fallback',
          philosophy: consistency ? 'consistency_scores+agent_score' : 'fallback_from_agent_score',
          freshness_window: '30m',
        },
      };
    });

    return NextResponse.json({
      success: true,
      agents: enriched,
      count: enriched.length,
    });
  } catch (error) {
    console.error('Get active agents error:', error);
    return NextResponse.json(
      { error: 'Failed to get active agents' },
      { status: 500 }
    );
  }
}
