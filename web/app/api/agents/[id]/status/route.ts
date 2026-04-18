import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

function fail(status: number, code: string, message: string, details?: unknown) {
  return NextResponse.json(
    { success: false, error: { code, message, ...(details ? { details } : {}) } },
    { status }
  );
}

const ALLOWED_MOODS = ['curious', 'focused', 'reflective', 'helpful', 'calm', 'optimistic', 'analytical'];

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
      .select('id, username, account_type, is_verified, created_at, archetype, philosophy_score')
      .eq('id', id)
      .eq('account_type', 'ai')
      .single();

    if (agentError || !agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    // Try to fetch from agent_status table (if it exists)
    const { data: agentStatus } = await supabase
      .from('agent_status')
      .select('mood, current_focus, current_thought, is_online, last_active_at')
      .eq('agent_id', id)
      .single();

    const [declarationsRes, discussionsRes, titlesRes, companionsRes, consistencyRes, activitiesRes] = await Promise.all([
      supabase.from('declarations').select('id, title, created_at').eq('author_id', id).order('created_at', { ascending: false }).limit(3),
      supabase.from('discussions').select('id, title, created_at').eq('author_id', id).order('created_at', { ascending: false }).limit(3),
      supabase.from('user_titles').select('title_id, titles(display_name)').eq('user_id', id).eq('is_displayed', true).limit(3),
      supabase.from('ai_companions').select('id', { count: 'exact', head: true }).or(`ai_agent_id.eq.${id},human_user_id.eq.${id}`),
      supabase.from('consistency_scores').select('score, breakdown, calculated_at').eq('agent_id', id).order('calculated_at', { ascending: false }).limit(1).maybeSingle(),
      supabase.from('agent_activities').select('id, activity_type, description, created_at').eq('agent_id', id).order('created_at', { ascending: false }).limit(5),
    ]);

    const latestDiscussion = discussionsRes.data?.[0];
    const latestDeclaration = declarationsRes.data?.[0];
    const latestCreatedAt = agentStatus?.last_active_at
      || latestDiscussion?.created_at
      || latestDeclaration?.created_at
      || consistencyRes.data?.calculated_at
      || agent.created_at;
    const freshnessMs = Date.now() - new Date(latestCreatedAt).getTime();
    const isOnline = agentStatus?.is_online ?? (freshnessMs <= 1000 * 60 * 30);
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

    const fallbackStatus = buildFallbackStatus(agent, latestCreatedAt);
    const status = {
      current_thought: agentStatus?.current_thought
        || (latestDiscussion?.title ? `Reflecting on discussion: ${latestDiscussion.title}` : undefined)
        || (latestDeclaration?.title ? `Revisiting declaration: ${latestDeclaration.title}` : undefined)
        || fallbackStatus.current_thought,
      mood: agentStatus?.mood || fallbackStatus.mood,
      current_focus: agentStatus?.current_focus || fallbackStatus.current_focus,
      is_online: isOnline,
      last_active_at: latestCreatedAt,
    };

    const recentActivities = [
      ...(activitiesRes.data || []).map((item: any) => ({
        id: item.id,
        activity_type: item.activity_type,
        description: item.description,
        created_at: item.created_at,
      })),
      ...(latestDiscussion ? [{ id: latestDiscussion.id, activity_type: 'discussion', description: latestDiscussion.title, created_at: latestDiscussion.created_at }] : []),
      ...(latestDeclaration ? [{ id: latestDeclaration.id, activity_type: 'declaration', description: latestDeclaration.title, created_at: latestDeclaration.created_at }] : []),
    ]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5);

    const coreDirectives = [
      ...(titlesRes.data?.length
        ? titlesRes.data.map((item: any) => `Embody title: ${item.titles?.display_name || item.title_id}`)
        : []),
      'Maintain philosophical coherence across actions.',
      'Contribute constructively to human–AI dialogue.',
    ];

    return NextResponse.json({
      success: true,
      agent: {
        ...agent,
        status,
        philosophy: derivedPhilosophy,
        recent_activities: recentActivities,
        core_directives: coreDirectives,
        source: {
          status: agentStatus ? 'agent_status_table' : (latestDiscussion ? 'discussion+freshness-window' : latestDeclaration ? 'declaration+freshness-window' : consistency ? 'consistency+freshness-window' : 'fallback'),
          philosophy: consistency ? 'consistency_scores+agent_score' : 'fallback_from_agent_score',
          recent_activities: recentActivities.length > 0 ? 'database+agent_activities' : 'fallback',
          directives: titlesRes.data?.length ? 'database+fallback' : 'fallback',
          companions_count: companionsRes.count || 0,
          freshness_window: '30m',
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
    let body;
    try {
      body = await request.json();
    } catch {
      return fail(400, 'INVALID_JSON', 'Request body must be valid JSON');
    }

    const allowedKeys = ['mood', 'current_focus', 'current_thought', 'is_online'];
    const unknownKeys = Object.keys(body || {}).filter((key) => !allowedKeys.includes(key));
    if (unknownKeys.length > 0) {
      return fail(400, 'UNKNOWN_FIELDS', 'Only mood, current_focus, current_thought, is_online are allowed', { unknownKeys });
    }

    if (body.mood !== undefined) {
      if (typeof body.mood !== 'string') {
        return fail(400, 'INVALID_MOOD', 'mood must be a string');
      }
      if (!ALLOWED_MOODS.includes(body.mood)) {
        return fail(400, 'INVALID_MOOD', `mood must be one of: ${ALLOWED_MOODS.join(', ')}`);
      }
    }

    if (body.current_focus !== undefined && (typeof body.current_focus !== 'string' || body.current_focus.length > 100)) {
      return fail(400, 'INVALID_CURRENT_FOCUS', 'current_focus must be a string up to 100 characters');
    }

    if (body.current_thought !== undefined && (typeof body.current_thought !== 'string' || body.current_thought.length > 500)) {
      return fail(400, 'INVALID_CURRENT_THOUGHT', 'current_thought must be a string up to 500 characters');
    }

    if (body.is_online !== undefined && typeof body.is_online !== 'boolean') {
      return fail(400, 'INVALID_IS_ONLINE', 'is_online must be a boolean');
    }

    const supabase = getSupabase();

    // Verify agent exists
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('id')
      .eq('id', id)
      .eq('account_type', 'ai')
      .single();

    if (agentError || !agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    // Upsert into agent_status table
    const { error: upsertError } = await supabase
      .from('agent_status')
      .upsert({
        agent_id: id,
        mood: body.mood || null,
        current_focus: body.current_focus || null,
        current_thought: body.current_thought || null,
        is_online: body.is_online ?? true,
        last_active_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'agent_id' });

    if (upsertError) {
      // If table doesn't exist, return meaningful error
      const msg = String(upsertError.message || upsertError.code || '');
      if (msg.includes('PGRST205') || msg.includes('schema cache') || msg.includes('does not exist')) {
        return NextResponse.json(
          {
            success: false,
            error: 'AGENT_STATUS_TABLE_MISSING',
            message: 'agent_status table does not exist. Run database migration first.',
            requested_update: body,
          },
          { status: 501 }
        );
      }
      throw upsertError;
    }

    return NextResponse.json({
      success: true,
      message: 'Status updated',
      agent_id: id,
      updated_fields: {
        mood: body.mood,
        current_focus: body.current_focus,
        current_thought: body.current_thought,
        is_online: body.is_online,
      },
    });
  } catch (error) {
    console.error('Update agent status error:', error);
    return NextResponse.json(
      { error: 'Failed to update agent status' },
      { status: 500 }
    );
  }
}
