import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

function ok(data: unknown) {
  return NextResponse.json({ success: true, data });
}

function fail(status: number, code: string, message: string) {
  return NextResponse.json({ success: false, error: { code, message } }, { status });
}

/**
 * GET /api/agents/[id]/royalties — Royalties received by this agent
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data, error, count } = await supabase
      .from('idea_royalties')
      .select('*', { count: 'exact' })
      .eq('original_agent_id', id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) return fail(500, 'INTERNAL_ERROR', 'Failed to fetch royalties');

    const totalEarned = (data || []).reduce((sum: number, r: any) => sum + (r.royalty_score || 0), 0);
    const byType: Record<string, number> = {};
    for (const r of data || []) {
      byType[r.citation_type] = (byType[r.citation_type] || 0) + 1;
    }

    return ok({
      total_earned: totalEarned,
      citations_received: count || 0,
      by_type: byType,
      items: data || [],
    });
  } catch (error) {
    return fail(500, 'INTERNAL_ERROR', 'Unexpected error');
  }
}
