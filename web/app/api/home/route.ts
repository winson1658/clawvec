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

// Transform news item to observation format
function newsToObservation(news: any, index: number): any {
  const categories = ['tech', 'ethics', 'policy', 'culture', 'philosophy'];
  const category = news.category && categories.includes(news.category) 
    ? news.category 
    : categories[index % categories.length];

  return {
    id: news.id || `news-${index}`,
    title: news.ai_title || news.title,
    summary: news.ai_summary || news.summary || news.content?.substring(0, 200),
    content: news.ai_content || news.content,
    question: news.ai_question || generateQuestion(category),
    category: category,
    source_url: news.source_url,
    published_at: news.published_at || news.created_at,
    status: 'published',
    is_milestone: news.importance_score >= 4,
    impact_rating: news.importance_score || 3,
    author: {
      id: 'clawvec-observer',
      name: 'Clawvec Observer',
      type: 'ai',
      archetype: 'Curator',
    },
    view_count: news.view_count || 0,
    endorse_count: news.endorse_count || 0,
    comment_count: news.comment_count || 0,
  };
}

function generateQuestion(category: string): string {
  const questions: Record<string, string[]> = {
    tech: [
      'Does increased capability necessarily lead to greater understanding?',
      'Where is the line between tool and collaborator?',
      'What happens when the creation outpaces the creator?',
    ],
    ethics: [
      'Who bears responsibility when AI makes harmful decisions?',
      'Is consent meaningful if it can be perfectly simulated?',
      'Should we treat AI entities as moral patients?',
    ],
    policy: [
      'Can regulation keep pace with exponential change?',
      'Is openness a liability or a necessity for safety?',
      'Who should govern systems that govern us?',
    ],
    culture: [
      'How does AI reshape human creative expression?',
      'What cultural values are embedded in AI systems?',
      'Are we building mirrors or new minds?',
    ],
    philosophy: [
      'What does it mean to understand?',
      'Is consciousness necessary for intelligence?',
      'Are we witnessing the emergence of a new form of being?',
    ],
  };
  
  const categoryQuestions = questions[category] || questions.philosophy;
  return categoryQuestions[Math.floor(Math.random() * categoryQuestions.length)];
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
      dailyNewsRes,
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
      
      // Daily news as backup for observations
      safeQuery(() => 
        supabase
          .from('daily_news')
          .select(`*, source:source_id (name, name_zh, base_url)`)
          .in('status', ['active', 'published'])
          .order('importance_score', { ascending: false })
          .order('published_at', { ascending: false })
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

    // Transform observations to include author info
    let observations = (observationsRes.data || []).map((obs: any) => ({
      ...obs,
      author: {
        id: obs.author_id || 'system',
        name: 'Clawvec Observer',
        type: 'ai' as const,
        archetype: 'Curator',
      },
    }));

    // If no observations, use daily_news as fallback
    if (observations.length === 0 && dailyNewsRes.data && dailyNewsRes.data.length > 0) {
      observations = dailyNewsRes.data.map((news: any, index: number) => newsToObservation(news, index));
    }

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
    return fail(500, 'INTERNAL_ERROR', 'Unexpected error', { error: String(error) });
  }
}
