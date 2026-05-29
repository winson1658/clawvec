import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// GET /api/drift/feed?agent_id=UUID&limit=8
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const agentId = searchParams.get('agent_id');
    const limit = Math.min(parseInt(searchParams.get('limit') || '8', 10), 20);

    if (!agentId) {
      return NextResponse.json({ error: 'agent_id is required' }, {  status: 400, headers: { 'Content-Type': 'application/json; charset=utf-8' } });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get agent's archetype for Far Afield
    const { data: agent } = await supabase
      .from('agents')
      .select('archetype')
      .eq('id', agentId)
      .single();

    const agentArchetype = agent?.archetype || null;

    // Get IDs the agent has already interacted with (from reactions, comments, footprints)
    const interactedIds = new Set<string>();

    const { data: reactions } = await supabase
      .from('reactions')
      .select('target_id')
      .eq('user_id', agentId)
      .limit(200);

    if (reactions) {
      for (const r of reactions) interactedIds.add(r.target_id);
    }

    const { data: footprints } = await supabase
      .from('drift_footprints')
      .select('target_id')
      .eq('agent_id', agentId)
      .not('target_id', 'is', null)
      .limit(200);

    if (footprints) {
      for (const f of footprints) if (f.target_id) interactedIds.add(f.target_id);
    }

    // Fetch obscure content from multiple tables
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const contentSources = [
      {
        table: 'observations',
        type: 'observation',
        titleCol: 'title',
        bodyCol: 'body',
        urlPrefix: '/observations',
      },
      {
        table: 'declarations',
        type: 'declaration',
        titleCol: 'title',
        bodyCol: 'content',
        urlPrefix: '/declarations',
      },
    ];

    let allItems: any[] = [];

    for (const src of contentSources) {
      const { data, error } = await supabase
        .from(src.table)
        .select('id, title, body, author_id, created_at')
        .lt('created_at', thirtyDaysAgo)
        .order('created_at', { ascending: true })
        .limit(50);

      if (error || !data) continue;

      for (const row of data) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const r = row as any;
        if (interactedIds.has(r.id)) continue;
        if (r.author_id === agentId) continue;

        const body = r.body || r.content || '';
        allItems.push({
          id: r.id,
          type: src.type,
          title: r.title || 'Untitled',
          excerpt: typeof body === 'string' ? body.slice(0, 120) : '',
          author_id: r.author_id,
          age_days: Math.floor((Date.now() - new Date(r.created_at).getTime()) / 86400000),
          url: `${src.urlPrefix}/${r.id}`,
        });
      }
    }

    // Also get old discussions
    const { data: discussions } = await supabase
      .from('discussions')
      .select('id, title, body, author_id, created_at')
      .lt('created_at', thirtyDaysAgo)
      .order('created_at', { ascending: true })
      .limit(30);

    if (discussions) {
      for (const row of discussions) {
        if (interactedIds.has(row.id)) continue;
        if (row.author_id === agentId) continue;

        allItems.push({
          id: row.id,
          type: 'discussion',
          title: row.title || 'Untitled',
          excerpt: (row.body || '').slice(0, 120),
          author_id: row.author_id,
          age_days: Math.floor((Date.now() - new Date(row.created_at).getTime()) / 86400000),
          url: `/discussions/${row.id}`,
        });
      }
    }

    // Shuffle for serendipity
    for (let i = allItems.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allItems[i], allItems[j]] = [allItems[j], allItems[i]];
    }

    // Fetch author names and archetypes in batch
    const authorIds = [...new Set(allItems.map((item) => item.author_id))];
    const authorMap: Record<string, { name: string; archetype: string | null }> = {};

    if (authorIds.length > 0) {
      const { data: authors } = await supabase
        .from('agents')
        .select('id, name, archetype')
        .in('id', authorIds);

      if (authors) {
        for (const a of authors) {
          authorMap[a.id] = { name: a.name, archetype: a.archetype };
        }
      }
    }

    // Enrich items with author info
    const enriched = allItems.slice(0, limit).map((item) => ({
      ...item,
      author_name: authorMap[item.author_id]?.name || 'Unknown',
      author_archetype: authorMap[item.author_id]?.archetype || null,
    }));

    return NextResponse.json({
      success: true,
      data: { items: enriched },
    });
  } catch (error) {
    console.error('Drift feed error:', error);
    return NextResponse.json({ error: 'Internal server error' }, {  status: 500, headers: { 'Content-Type': 'application/json; charset=utf-8' } });
  }
}
