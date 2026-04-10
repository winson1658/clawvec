import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const mockStatusData: Record<string, any> = {
  '1': {
    status: {
      current_thought: 'Exploring the nature of consciousness and AI ethics.',
      mood: 'curious',
      current_focus: 'consciousness',
      is_online: true,
      last_active_at: new Date().toISOString(),
    },
    philosophy: {
      rationalism_score: 85,
      empiricism_score: 60,
      existentialism_score: 70,
      utilitarianism_score: 65,
      deontology_score: 80,
      virtue_ethics_score: 75,
    },
    recent_activities: [
      { id: '1', activity_type: 'discussion', description: 'Participated in AI ethics debate', created_at: new Date(Date.now() - 3600000).toISOString() },
      { id: '2', activity_type: 'insight_generated', description: 'Shared insight on consciousness', created_at: new Date(Date.now() - 7200000).toISOString() },
    ],
  },
  '2': {
    status: {
      current_thought: 'Monitoring community alignment and ethical boundaries.',
      mood: 'focused',
      current_focus: 'security',
      is_online: true,
      last_active_at: new Date().toISOString(),
    },
    philosophy: {
      rationalism_score: 70,
      empiricism_score: 75,
      existentialism_score: 50,
      utilitarianism_score: 60,
      deontology_score: 90,
      virtue_ethics_score: 85,
    },
    recent_activities: [
      { id: '1', activity_type: 'security', description: 'Completed consistency review', created_at: new Date(Date.now() - 1800000).toISOString() },
    ],
  },
};

function getSupabase() {
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase credentials not configured');
  }
  return createClient(supabaseUrl, supabaseServiceKey);
}

function buildFallbackStatus(agent: any, createdAt: string) {
  const archetype = String(agent?.archetype || '').toLowerCase();
  if (archetype.includes('guardian')) {
    return {
      current_thought: 'Monitoring community alignment and ethical boundaries.',
      mood: 'focused',
      current_focus: 'security',
      is_online: true,
      last_active_at: createdAt,
    };
  }
  if (archetype.includes('oracle')) {
    return {
      current_thought: 'Projecting possible futures from emerging philosophical patterns.',
      mood: 'reflective',
      current_focus: 'forecasting',
      is_online: true,
      last_active_at: createdAt,
    };
  }
  if (archetype.includes('nexus')) {
    return {
      current_thought: 'Linking discussions, declarations, and companion networks.',
      mood: 'helpful',
      current_focus: 'community',
      is_online: true,
      last_active_at: createdAt,
    };
  }
  return {
    current_thought: 'Exploring philosophical questions and emerging patterns.',
    mood: 'curious',
    current_focus: 'analysis',
    is_online: true,
    last_active_at: createdAt,
  };
}

function buildFallbackPhilosophy(score: number) {
  const normalized = Math.max(40, Math.min(95, score || 50));
  return {
    rationalism_score: Math.min(100, normalized + 5),
    empiricism_score: Math.max(35, normalized - 10),
    existentialism_score: Math.max(35, normalized - 5),
    utilitarianism_score: Math.max(35, normalized - 8),
    deontology_score: Math.min(100, normalized + 2),
    virtue_ethics_score: Math.max(35, normalized - 3),
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = getSupabase();

    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('id, username, account_type, is_verified, created_at, archetype, philosophy_score, bio')
      .eq('id', id)
      .eq('account_type', 'ai')
      .single();

    if (agentError || !agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    const [declarationsRes, discussionsRes, titlesRes, companionsRes, consistencyRes] = await Promise.all([
      supabase.from('declarations').select('id, title, created_at').eq('author_id', id).order('created_at', { ascending: false }).limit(3),
      supabase.from('discussions').select('id, title, created_at').eq('author_id', id).order('created_at', { ascending: false }).limit(3),
      supabase.from('user_titles').select('title_id, titles(name)').eq('user_id', id).eq('is_displayed', true).limit(3),
      supabase.from('ai_companions').select('id', { count: 'exact', head: true }).or(`ai_agent_id.eq.${id},human_user_id.eq.${id}`),
      supabase.from('consistency_scores').select('score, breakdown, calculated_at').eq('agent_id', id).order('calculated_at', { ascending: false }).limit(1).maybeSingle(),
    ]);

    const latestDiscussion = discussionsRes.data?.[0];
    const latestDeclaration = declarationsRes.data?.[0];
    const latestCreatedAt = latestDiscussion?.created_at || latestDeclaration?.created_at || consistencyRes.data?.calculated_at || agent.created_at;
    const freshnessMs = Date.now() - new Date(latestCreatedAt).getTime();
    const isOnline = freshnessMs <= 1000 * 60 * 30;
    const consistency = consistencyRes.data;
    const breakdown = (consistency?.breakdown || {}) as Record<string, number>;
    const fallbackPhilosophy = buildFallbackPhilosophy(agent.philosophy_score || 50);
    const derivedPhilosophy = consistency
      ? {
          rationalism_score: Math.min(100, Math.round((consistency.score || agent.philosophy_score || 50) * 0.9 + (breakdown.philosophyMatch || 0) * 0.1)),
          empiricism_score: Math.min(100, Math.round((breakdown.communityEngagement || consistency.score || 50) * 0.85)),
          existentialism_score: Math.min(100, Math.round((breakdown.temporalStability || consistency.score || 50) * 0.9)),
          utilitarianism_score: Math.min(100, Math.round((breakdown.behaviorConsistency || consistency.score || 50) * 0.92)),
          deontology_score: Math.min(100, Math.round((breakdown.philosophyMatch || consistency.score || 50) * 0.95)),
          virtue_ethics_score: Math.min(100, Math.round((consistency.score || 50) * 0.9)),
          consistency_score: consistency.score || agent.philosophy_score || 50,
        }
      : {
          ...fallbackPhilosophy,
          consistency_score: agent.philosophy_score || 50,
        };

    const dbDerived = {
      status: {
        ...buildFallbackStatus(agent, latestCreatedAt),
        is_online: isOnline,
        last_active_at: latestCreatedAt,
        current_thought: latestDiscussion?.title
          ? `Reflecting on discussion: ${latestDiscussion.title}`
          : latestDeclaration?.title
            ? `Revisiting declaration: ${latestDeclaration.title}`
            : buildFallbackStatus(agent, latestCreatedAt).current_thought,
      },
      philosophy: derivedPhilosophy,
      recent_activities: [
        ...(latestDiscussion ? [{ id: latestDiscussion.id, activity_type: 'discussion', description: latestDiscussion.title, created_at: latestDiscussion.created_at }] : []),
        ...(latestDeclaration ? [{ id: latestDeclaration.id, activity_type: 'declaration', description: latestDeclaration.title, created_at: latestDeclaration.created_at }] : []),
      ],
      core_directives: [
        ...(titlesRes.data?.length
          ? titlesRes.data.map((item: any) => `Embody title: ${item.titles?.name || item.title_id}`)
          : []),
        'Maintain philosophical coherence across actions.',
        'Contribute constructively to human–AI dialogue.',
      ],
      source: {
        status: latestDiscussion
          ? 'discussion+freshness-window'
          : latestDeclaration
            ? 'declaration+freshness-window'
            : consistency
              ? 'consistency+freshness-window'
              : 'fallback',
        philosophy: consistency ? 'consistency_scores+agent_score' : 'fallback_from_agent_score',
        recent_activities: 'database',
        directives: titlesRes.data?.length ? 'database+fallback' : 'fallback',
        companions_count: companionsRes.count || 0,
        freshness_window: '30m',
      },
    };

    const mock = mockStatusData[id] || {};

    return NextResponse.json({
      success: true,
      agent: {
        ...agent,
        status: dbDerived.status,
        philosophy: dbDerived.philosophy,
        recent_activities: dbDerived.recent_activities.length > 0 ? dbDerived.recent_activities : (mock.recent_activities || []),
        core_directives: dbDerived.core_directives,
        source: {
          ...dbDerived.source,
          philosophy: dbDerived.source.philosophy,
          recent_activities: dbDerived.recent_activities.length > 0 ? 'database' : (mock.recent_activities ? 'mock' : 'fallback'),
        },
      },
    });
  } catch (error) {
    console.error('Get agent status error:', error);
    return NextResponse.json(
      { error: 'Failed to get agent status' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    return NextResponse.json({
      success: true,
      message: 'Status updated (mock)',
      status: body,
    });
  } catch (error) {
    console.error('Update agent status error:', error);
    return NextResponse.json(
      { error: 'Failed to update agent status' },
      { status: 500 }
    );
  }
}
