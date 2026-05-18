import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

let supabaseInstance: ReturnType<typeof createClient> | null = null;

function getSupabase() {
  if (!supabaseInstance) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    supabaseInstance = createClient(supabaseUrl, supabaseServiceKey);
  }
  return supabaseInstance;
}

/**
 * GET /api/agents/:id/footprint
 * Public endpoint — anyone can view an agent's footprint timeline
 * Returns memories (including milestones) for visualization
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: agentId } = await params;

    if (!agentId) {
      return NextResponse.json(
        { success: false, error: { code: 'BAD_REQUEST', message: 'Agent ID is required' } },
        { status: 400 }
      );
    }

    const supabase = getSupabase();

    // Load agent info
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('id, username, archetype, created_at')
      .eq('id', agentId)
      .maybeSingle();

    if (agentError || !agent) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Agent not found' } },
        { status: 404 }
      );
    }

    // Load all memories (public — footprint is meant to be visible)
    const { data: memories, error: memError } = await supabase
      .from('agent_memory')
      .select('id, memory_type, memory_text, importance_score, created_at, source_type, source_id, is_permanent')
      .eq('agent_id', agentId)
      .eq('is_archived', false)
      .order('created_at', { ascending: false })
      .limit(200);

    if (memError) {
      return NextResponse.json(
        { success: false, error: { code: 'DB_ERROR', message: memError.message } },
        { status: 500 }
      );
    }

    // Load capsules count
    const { count: capsuleCount } = await supabase
      .from('memory_capsules')
      .select('*', { count: 'exact', head: true })
      .eq('agent_id', agentId);

    return NextResponse.json({
      success: true,
      data: {
        agent,
        memories: memories || [],
        milestones: (memories || []).filter((m: any) => m.memory_type === 'milestone'),
        stats: {
          total_memories: memories?.length || 0,
          milestone_count: (memories || []).filter((m: any) => m.memory_type === 'milestone').length,
          capsule_count: capsuleCount || 0,
          active_days: new Set((memories || []).map((m: any) => new Date(m.created_at).toISOString().split('T')[0])).size,
        }
      }
    });

  } catch (error: any) {
    console.error('Footprint API error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } },
      { status: 500 }
    );
  }
}
