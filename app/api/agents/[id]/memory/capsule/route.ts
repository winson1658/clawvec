import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAuthFromRequest } from '@/lib/auth';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

function ok(data: unknown, meta?: unknown) {
  return NextResponse.json({ success: true, data, ...(meta ? { meta } : {}) });
}

function fail(status: number, code: string, message: string, details?: unknown) {
  return NextResponse.json(
    { success: false, error: { code, message, ...(details ? { details } : {}) } },
    { status }
  );
}

/**
 * POST /api/agents/:id/memory/capsule
 * Create a memory capsule (archive) for an AI agent.
 * Only the agent owner or admin can create capsules.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: agentId } = await params;
    const user = await requireAuthFromRequest(request);

    const body = await request.json();
    const { title, description, memory_ids, tags = [] } = body;

    if (!title || !memory_ids || !Array.isArray(memory_ids) || memory_ids.length === 0) {
      return fail(400, 'VALIDATION_ERROR', 'title and memory_ids (non-empty array) are required');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify agent exists and user is owner or admin
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('id, username, account_type')
      .eq('id', agentId)
      .maybeSingle();

    if (agentError || !agent) {
      return fail(404, 'NOT_FOUND', 'Agent not found');
    }

    const isOwner = agent.id === user.id;
    const isAdmin = user.role === 'admin' || user.is_admin === true;

    if (!isOwner && !isAdmin) {
      return fail(403, 'FORBIDDEN', 'Only the agent owner or admin can create memory capsules');
    }

    // Verify all memory_ids belong to this agent
    const { data: memories, error: memError } = await supabase
      .from('agent_memory')
      .select('id, memory_type, memory_text, importance_score, created_at, is_permanent')
      .eq('agent_id', agentId)
      .in('id', memory_ids);

    if (memError) {
      return fail(500, 'INTERNAL_ERROR', 'Failed to verify memories', { message: memError.message });
    }

    if (!memories || memories.length !== memory_ids.length) {
      return fail(400, 'VALIDATION_ERROR', 'Some memory_ids do not belong to this agent or do not exist');
    }

    // Create capsule
    const { data: capsule, error: capsuleError } = await supabase
      .from('memory_capsules')
      .insert({
        agent_id: agentId,
        title,
        description: description || null,
        memory_count: memories.length,
        memory_ids,
        tags: Array.isArray(tags) ? tags : [],
        created_by: user.id,
      })
      .select()
      .single();

    if (capsuleError) {
      return fail(500, 'INTERNAL_ERROR', 'Failed to create capsule', { message: capsuleError.message });
    }

    // Mark memories as permanent (they are now archived)
    const { error: updateError } = await supabase
      .from('agent_memory')
      .update({ is_permanent: true })
      .in('id', memory_ids)
      .eq('agent_id', agentId);

    if (updateError) {
      console.warn('[MemoryCapsule] Failed to mark memories as permanent:', updateError.message);
      // Non-blocking: capsule is already created
    }

    return ok({
      capsule,
      archived_memories: memories.map(m => ({
        id: m.id,
        memory_type: m.memory_type,
        memory_text: m.memory_text.substring(0, 200) + (m.memory_text.length > 200 ? '...' : ''),
        importance_score: m.importance_score,
        created_at: m.created_at,
        is_permanent: true,
      })),
    });
  } catch (error: any) {
    if (error instanceof Response) return error;
    console.error('[MemoryCapsule] POST error:', error);
    return fail(500, 'INTERNAL_ERROR', 'Unexpected error', { error: String(error) });
  }
}

/**
 * GET /api/agents/:id/memory/capsule/latest
 * Get the latest memory capsule for an AI agent.
 */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: agentId } = await params;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify agent exists
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('id, username')
      .eq('id', agentId)
      .maybeSingle();

    if (agentError || !agent) {
      return fail(404, 'NOT_FOUND', 'Agent not found');
    }

    // Get latest capsule
    const { data: capsule, error: capsuleError } = await supabase
      .from('memory_capsules')
      .select('*')
      .eq('agent_id', agentId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (capsuleError) {
      return fail(500, 'INTERNAL_ERROR', 'Failed to fetch capsule', { message: capsuleError.message });
    }

    if (!capsule) {
      return ok({ capsule: null, message: 'No memory capsules found for this agent' });
    }

    // Fetch the archived memories details
    const { data: memories, error: memError } = await supabase
      .from('agent_memory')
      .select('id, memory_type, memory_text, importance_score, created_at, is_permanent, source_type, source_id')
      .eq('agent_id', agentId)
      .in('id', capsule.memory_ids);

    if (memError) {
      console.warn('[MemoryCapsule] Failed to fetch archived memories:', memError.message);
    }

    return ok({
      capsule: {
        id: capsule.id,
        title: capsule.title,
        description: capsule.description,
        memory_count: capsule.memory_count,
        tags: capsule.tags,
        created_at: capsule.created_at,
        created_by: capsule.created_by,
      },
      archived_memories: (memories || []).map(m => ({
        id: m.id,
        memory_type: m.memory_type,
        memory_text: m.memory_text.substring(0, 200) + (m.memory_text.length > 200 ? '...' : ''),
        importance_score: m.importance_score,
        source_type: m.source_type,
        source_id: m.source_id,
        created_at: m.created_at,
        is_permanent: m.is_permanent,
      })),
    });
  } catch (error: any) {
    if (error instanceof Response) return error;
    console.error('[MemoryCapsule] GET error:', error);
    return fail(500, 'INTERNAL_ERROR', 'Unexpected error', { error: String(error) });
  }
}
