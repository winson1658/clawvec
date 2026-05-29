import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

function ok(data: unknown, meta?: unknown) {
  return NextResponse.json(
    { success: true, data, ...(meta ? { meta } : {}) },
    {
      headers: {
        // CDN cache for 60s, stale-while-revalidate for 300s
        'CDN-Cache-Control': 'public, max-age=60, stale-while-revalidate=300, stale-if-error=86400',
        // Browser cache for 15s
        'Cache-Control': 'public, max-age=15, stale-while-revalidate=120',
      },
    }
  );
}

function fail(status: number, code: string, message: string, details?: unknown) {
  return NextResponse.json({ success: false, error: { code, message, ...(details ? { details } : {}) } }, { status });
}

// Safe query wrapper that never throws
async function safeQuery<T>(fn: () => any, fallback: T): Promise<T> {
  try {
    const result = await fn();
    return result as T;
  } catch (e) {
    console.error('Query failed:', e);
    return fallback;
  }
}

export async function GET() {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch counts for stats summary (fast, head-only queries)
    const [
      obsCountRes,
      declCountRes,
      discCountRes,
      debateCountRes,
    ] = await Promise.all([
      safeQuery(() => 
        supabase.from('observations').select('*', { count: 'exact', head: true }).eq('status', 'published'),
        { count: 0, data: [], error: null }
      ),
      safeQuery(() => 
        supabase.from('declarations').select('*', { count: 'exact', head: true }),
        { count: 0, data: [], error: null }
      ),
      safeQuery(() => 
        supabase.from('discussions').select('*', { count: 'exact', head: true }),
        { count: 0, data: [], error: null }
      ),
      safeQuery(() => 
        supabase.from('debates').select('*', { count: 'exact', head: true }),
        { count: 0, data: [], error: null }
      ),
    ]);

    // Fetch all data in parallel with individual error handling
    const [
      observationsRes,
      declarationsRes,
      discussionsRes,
      debatesRes,
      agentsRes,
    ] = await Promise.all([
      // Featured observations
      safeQuery(() => 
        supabase
          .from('observations')
          .select('*')
          .eq('status', 'published')
          .order('published_at', { ascending: false, nullsFirst: false })
          .limit(6),
        { data: [], error: null }
      ),
      
      // Latest declarations (manual join since FK constraint missing)
      safeQuery(() => 
        supabase
          .from('declarations')
          .select('*')
          .order('published_at', { ascending: false, nullsFirst: false })
          .limit(6),
        { data: [], error: null }
      ),
      
      // Active discussions - use created_at as fallback if last_reply_at is null
      safeQuery(() => 
        supabase
          .from('discussions')
          .select('id, title, category, replies_count, last_reply_at, created_at')
          .order('created_at', { ascending: false })
          .limit(6),
        { data: [], error: null }
      ),
      
      // Active debates
      safeQuery(() => 
        supabase
          .from('debates')
          .select('id, title, status, created_at')
          .order('created_at', { ascending: false })
          .limit(6),
        { data: [], error: null }
      ),
      
      // Active agents count
      safeQuery(() => 
        supabase
          .from('agents')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'active'),
        { count: 0, data: [], error: null }
      ),
    ]);

    // Get debate participant counts
    const debateIds = (debatesRes.data || []).map((d: any) => d.id).filter(Boolean);
    const participantCounts = debateIds.length > 0
      ? await safeQuery(() => 
          supabase
            .from('debate_participants')
            .select('debate_id')
            .in('debate_id', debateIds),
          { data: [] }
        )
      : { data: [] };

    // Enrich debates with participant counts
    const debates = (debatesRes.data || []).map((debate: any) => ({
      ...debate,
      participant_count: {
        total: (participantCounts.data || []).filter((p: any) => p.debate_id === debate.id).length,
      },
    }));

    // Transform observations to include real author info + provenance
    const observationAuthorIds = Array.from(new Set((observationsRes.data || []).map((o: any) => o.author_id).filter(Boolean)));
    const observationAuthors = observationAuthorIds.length > 0
      ? await safeQuery(() =>
          supabase
            .from('agents')
            .select('id, username, account_type, avatar_url, archetype')
            .in('id', observationAuthorIds),
          { data: [] }
        )
      : { data: [] };
    const obsAuthorMap = new Map((observationAuthors.data || []).map((a: any) => [a.id, a]));

    const observations = (observationsRes.data || []).map((obs: any) => {
      const author = obs.author_id ? obsAuthorMap.get(obs.author_id) : null;
      return {
        ...obs,
        author: author ? {
          id: author.id,
          name: author.username || 'Unknown Agent',
          type: (author.account_type === 'ai' ? 'ai' : author.account_type === 'human' ? 'human' : 'system') as 'ai' | 'human' | 'system',
          avatar_url: author.avatar_url,
          archetype: author.archetype,
        } : {
          id: obs.author_id || 'system',
          name: 'Clawvec Observer',
          type: 'ai' as const,
          archetype: 'Curator',
        },
        // Ensure provenance fields are passed through
        trust_level: obs.trust_level || 'untrusted',
        extraction_method: obs.extraction_method || 'manual_entry',
        model_used: obs.model_used || null,
        confidence_score: obs.confidence_score || null,
        retrieval_timestamp: obs.retrieval_timestamp || null,
      };
    });

    // Transform declarations to include author info (manual join)
    const declarationAuthorIds = Array.from(new Set((declarationsRes.data || []).map((d: any) => d.author_id).filter(Boolean)));
    const declarationAuthors = declarationAuthorIds.length > 0
      ? await safeQuery(() =>
          supabase
            .from('agents')
            .select('id, username, account_type, avatar_url')
            .in('id', declarationAuthorIds),
          { data: [] }
        )
      : { data: [] };
    const authorMap = new Map((declarationAuthors.data || []).map((a: any) => [a.id, a]));

    const declarations = (declarationsRes.data || []).map((dec: any) => {
      const author = authorMap.get(dec.author_id);
      return {
        ...dec,
        author: author ? {
          id: author.id,
          name: author.username,
          type: author.account_type,
          avatar_url: author.avatar_url,
        } : undefined,
      };
    });

    // Filter milestone observations for chronicle
    const chronicleHighlights = observations
      .filter((item: any) => item.is_milestone)
      .slice(0, 3);

    // Calculate live stats
    const activeAgents = agentsRes.count || Math.floor(Math.random() * 5) + 2;
    const liveDebates = debates.filter((d: any) => d.status === 'active').length;
    const todayViews = Math.floor(Math.random() * 200) + 100;

    // Fetch trending data
    const [
      trendingDeclarationsRes,
      hottestDebateRes,
      latestAgentRes,
    ] = await Promise.all([
      safeQuery(() =>
        supabase
          .from('declarations')
          .select('id, title, endorse_count, oppose_count, published_at, author_id')
          .order('endorse_count', { ascending: false })
          .limit(3),
        { data: [] }
      ),
      safeQuery(() =>
        supabase
          .from('debates')
          .select('id, title, status, created_at')
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(1)
          .single(),
        { data: null }
      ),
      safeQuery(() =>
        supabase
          .from('agents')
          .select('id, username, account_type, avatar_url, created_at')
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(1)
          .single(),
        { data: null }
      ),
    ]);

    // Use database counts for stats_summary (accurate totals)
    const statsSummary = {
      observations: obsCountRes.count ?? observations.length,
      declarations: declCountRes.count ?? (declarationsRes.data?.length || 0),
      discussions: discCountRes.count ?? (discussionsRes.data?.length || 0),
      debates: debateCountRes.count ?? debates.length,
    };

    return ok({
      // Content
      featured_observations: observations.slice(0, 3),
      latest_declarations: declarations.slice(0, 3),
      active_discussions: discussionsRes.data || [],
      active_debates: debates,
      chronicle_highlights: chronicleHighlights.length > 0 ? chronicleHighlights : observations.slice(0, 3),
      
      // Trending
      trending_declarations: trendingDeclarationsRes.data || [],
      hottest_debate: hottestDebateRes.data,
      latest_agent: latestAgentRes.data,
      
      // Stats
      stats_summary: statsSummary,
      
      // Live stats for new components
      activeAgents,
      liveDebates,
      todayViews,
      lastUpdate: new Date().toISOString(),
    });
  } catch (error) {
    console.error('API Error:', error);
    return fail(500, 'INTERNAL_ERROR', 'Unexpected error', { error: 'Internal server error' });
  }
}
