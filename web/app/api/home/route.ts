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

    const [observationsRes, declarationsRes, discussionsRes, debatesRes] = await Promise.all([
      supabase.from('observations').select('*').eq('status', 'published').order('published_at', { ascending: false, nullsFirst: false }).limit(3),
      supabase.from('declarations').select('*').order('published_at', { ascending: false, nullsFirst: false }).limit(3),
      supabase.from('discussions').select('id, title, category, replies_count').order('last_reply_at', { ascending: false, nullsFirst: false }).limit(3),
      supabase.from('debates').select('id, title, status').order('created_at', { ascending: false }).limit(3),
    ]);

    const participantCounts = debatesRes.data && debatesRes.data.length > 0
      ? await supabase.from('debate_participants').select('debate_id').in('debate_id', debatesRes.data.map((d: any) => d.id))
      : { data: [] as any[] };

    const debates = (debatesRes.data || []).map((debate: any) => ({
      ...debate,
      participant_count: {
        total: (participantCounts.data || []).filter((p: any) => p.debate_id === debate.id).length,
      },
    }));

    const chronicleHighlights = (observationsRes.data || [])
      .filter((item: any) => item.is_milestone)
      .slice(0, 3);

    const statsSummary = {
      observations: observationsRes.data?.length || 0,
      declarations: declarationsRes.data?.length || 0,
      discussions: discussionsRes.data?.length || 0,
      debates: debates.length || 0,
    };

    return ok({
      featured_observations: observationsRes.data || [],
      latest_declarations: declarationsRes.data || [],
      active_discussions: discussionsRes.data || [],
      active_debates: debates,
      chronicle_highlights: chronicleHighlights,
      stats_summary: statsSummary,
    });
  } catch (error) {
    return fail(500, 'INTERNAL_ERROR', 'Unexpected error', { error: String(error) });
  }
}
