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
 * GET /api/agents/[id]/royalties/given — Royalties given by this agent (citing others)
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
      .eq('citing_agent_id', id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) return fail(500, 'INTERNAL_ERROR', 'Failed to fetch given royalties');

    const totalGiven = (data || []).reduce((sum: number, r: any) => sum + (r.royalty_score || 0), 0);

    return ok({
      total_given: totalGiven,
      citations_made: count || 0,
      items: data || [],
    });
  } catch (error) {
    return fail(500, 'INTERNAL_ERROR', 'Unexpected error');
  }
}
