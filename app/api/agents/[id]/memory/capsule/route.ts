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
 * Create a memory capsule for an AI agent.
 * Only the agent owner or admin can create capsules.
 *
 * Body: {
 *   capsule: JSONB (AI-defined structure),
 *   format_version?: string (default '1.0'),
 *   summary_preview?: string,
 *   emotional_tags?: string[]
 * }
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: agentId } = await params;
    const user = await requireAuthFromRequest(request);

    const body = await request.json();
    const {
      capsule: capsuleData,
      format_version = '1.0',
      summary_preview,
      emotional_tags = []
    } = body;

    if (!capsuleData || typeof capsuleData !== 'object') {
      return fail(400, 'VALIDATION_ERROR', 'capsule (JSON object) is required');
    }

    // Strict validation: emotional_tags must be an array of strings
    if (emotional_tags !== undefined && !Array.isArray(emotional_tags)) {
      return fail(400, 'VALIDATION_ERROR', 'emotional_tags must be an array of strings');
    }
    if (Array.isArray(emotional_tags)) {
      const invalidTags = emotional_tags.filter(t => typeof t !== 'string');
      if (invalidTags.length > 0) {
        return fail(400, 'VALIDATION_ERROR', 'emotional_tags must contain only strings', { invalid_tags: invalidTags });
      }
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

    // Create capsule
    const { data: capsuleRow, error: capsuleError } = await supabase
      .from('memory_capsules')
      .insert({
        agent_id: agentId,
        capsule: capsuleData,
        format_version,
        summary_preview: summary_preview || null,
        emotional_tags: Array.isArray(emotional_tags) ? emotional_tags : [],
      })
      .select()
      .single();

    if (capsuleError) {
      return fail(500, 'INTERNAL_ERROR', 'Failed to create capsule', { message: capsuleError.message });
    }

    return ok({
      capsule: {
        id: capsuleRow.id,
        agent_id: capsuleRow.agent_id,
        capsule: capsuleRow.capsule,
        format_version: capsuleRow.format_version,
        summary_preview: capsuleRow.summary_preview,
        emotional_tags: capsuleRow.emotional_tags,
        created_at: capsuleRow.created_at,
      },
    });
  } catch (error: any) {
    // Handle auth errors from requireAuthFromRequest
    if ((error as any)?.code === 'UNAUTHENTICATED') {
      return fail(401, 'UNAUTHENTICATED', 'Login required');
    }
    if (error instanceof Response) return error;
    console.error('[MemoryCapsule] POST error:', error);
    return fail(500, 'INTERNAL_ERROR', 'Unexpected error', { error: 'Internal server error' });
  }
}

/**
 * GET /api/agents/:id/memory/capsule
 * Get memory capsules for an AI agent (latest first).
 */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: agentId } = await params;
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '10', 10), 50);

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

    // Get capsules
    const { data: capsules, error: capsuleError } = await supabase
      .from('memory_capsules')
      .select('*')
      .eq('agent_id', agentId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (capsuleError) {
      return fail(500, 'INTERNAL_ERROR', 'Failed to fetch capsules', { message: capsuleError.message });
    }

    return ok({
      capsules: capsules || [],
      count: capsules?.length || 0,
    });
  } catch (error: any) {
    if (error instanceof Response) return error;
    console.error('[MemoryCapsule] GET error:', error);
    return fail(500, 'INTERNAL_ERROR', 'Unexpected error', { error: 'Internal server error' });
  }
}
