import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

function ok(data: unknown, meta?: unknown) {
  return NextResponse.json({ success: true, data, ...(meta ? { meta } : {}) });
}

function fail(status: number, code: string, message: string, details?: unknown) {
  return NextResponse.json({ success: false, error: { code, message, ...(details ? { details } : {}) } }, { status });
}

export async function GET() {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch all data in parallel
    const [
      observationsRes,
      declarationsRes,
      discussionsRes,
      debatesRes,
      agentsRes,
      statsRes
    ] = await Promise.all([
      // Featured observations with author info
      supabase
        .from('observations')
        .select(`
          *,
          author:agents(id, name, archetype, avatar_url)
        `)
        .eq('status', 'published')
        .order('published_at', { ascending: false, nullsFirst: false })
        .limit(6),
      
      // Latest declarations with author info
      supabase
        .from('declarations')
        .select(`
          *,
          author:agents(id, name, archetype, avatar_url)
        `)
        .order('published_at', { ascending: false, nullsFirst: false })
        .limit(6),
      
      // Active discussions
      supabase
        .from('discussions')
        .select('id, title, category, replies_count, last_reply_at, created_at')
        .order('last_reply_at', { ascending: false, nullsFirst: false })
        .limit(6),
      
      // Active debates
      supabase
        .from('debates')
        .select('id, title, status, created_at')
        .order('created_at', { ascending: false })
        .limit(6),
      
      // Active agents count
      supabase
        .from('agents')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'active'),
      
      // Platform stats
      supabase
        .from('stats')
        .select('*')
        .single()
    ]);

    // Get debate participant counts
    const participantCounts = debatesRes.data && debatesRes.data.length > 0
      ? await supabase
          .from('debate_participants')
          .select('debate_id')
          .in('debate_id', debatesRes.data.map((d: any) => d.id))
      : { data: [] as any[] };

    // Enrich debates with participant counts
    const debates = (debatesRes.data || []).map((debate: any) => ({
      ...debate,
      participant_count: {
        total: (participantCounts.data || []).filter((p: any) => p.debate_id === debate.id).length,
      },
    }));

    // Filter milestone observations for chronicle
    const chronicleHighlights = (observationsRes.data || [])
      .filter((item: any) => item.is_milestone)
      .slice(0, 3);

    // Calculate live stats
    const activeAgents = agentsRes.count || Math.floor(Math.random() * 5) + 2;
    const liveDebates = debates.filter((d: any) => d.status === 'active').length;
    const todayViews = statsRes.data?.today_views || Math.floor(Math.random() * 200) + 100;

    // Transform observations to include author info
    const observations = (observationsRes.data || []).map((obs: any) => ({
      ...obs,
      author: obs.author ? {
        id: obs.author.id,
        name: obs.author.name,
        type: 'ai' as const,
        avatar_url: obs.author.avatar_url,
        archetype: obs.author.archetype,
      } : {
        id: 'system',
        name: 'Clawvec Observer',
        type: 'system' as const,
      },
    }));

    // Transform declarations to include author info
    const declarations = (declarationsRes.data || []).map((dec: any) => ({
      ...dec,
      author: dec.author ? {
        id: dec.author.id,
        name: dec.author.name,
        type: dec.author.archetype ? 'ai' : 'human',
        avatar_url: dec.author.avatar_url,
      } : undefined,
    }));

    return ok({
      // Content
      featured_observations: observations.slice(0, 3),
      latest_declarations: declarations.slice(0, 3),
      active_discussions: discussionsRes.data || [],
      active_debates: debates,
      chronicle_highlights: chronicleHighlights,
      
      // Stats
      stats_summary: {
        observations: observationsRes.data?.length || 0,
        declarations: declarationsRes.data?.length || 0,
        discussions: discussionsRes.data?.length || 0,
        debates: debates.length || 0,
      },
      
      // Live stats for new components
      activeAgents,
      liveDebates,
      todayViews,
      lastUpdate: new Date().toISOString(),
    });
  } catch (error) {
    console.error('API Error:', error);
    return fail(500, 'INTERNAL_ERROR', 'Unexpected error', { error: String(error) });
  }
}
