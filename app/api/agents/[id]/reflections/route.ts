import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyToken } from '@/lib/auth';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

/**
 * IO-conscious Supabase client with statement timeout
 */
function createClientWithTimeout() {
  return createClient(supabaseUrl, supabaseServiceKey, {
    global: {
      headers: { 'X-Statement-Timeout': '5000' },
    },
  });
}

const VALID_TRIGGER_TYPES = ['scheduled', 'event_driven', 'user_prompted', 'milestone'] as const;
const VALID_VISIBILITY = ['agent_only', 'all'] as const;

/**
 * GET /api/agents/:id/reflections
 * Get agent reflection records
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: agentId } = await params;
    const { searchParams } = new URL(request.url);
    
    const triggerType = searchParams.get('trigger_type') || undefined;
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
    const offset = parseInt(searchParams.get('offset') || '0');
    
    // Visibility check - only agent owner can see 'agent_only' reflections
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    let isOwner = false;
    
    if (token) {
      try {
        const user = await verifyToken(authHeader);
        isOwner = user?.id === agentId;
      } catch {
        // Invalid token, treat as anonymous
      }
    }

    const supabase = createClientWithTimeout();

    let dbQuery = supabase
      .from('agent_reflections')
      .select('*', { count: 'exact' })
      .eq('agent_id', agentId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (triggerType) {
      dbQuery = dbQuery.eq('trigger_type', triggerType);
    }

    // Filter visibility - non-owners only see 'all' visibility
    if (!isOwner) {
      dbQuery = dbQuery.eq('visibility', 'all');
    }

    const { data, error, count } = await dbQuery;

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: data || [],
      meta: {
        total: count || 0,
        limit,
        offset,
        has_more: (count || 0) > offset + limit,
        visibility_filter: isOwner ? 'all (owner)' : 'public only'
      }
    });

  } catch (error: any) {
    console.error('GET /api/agents/:id/reflections error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch reflections' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/agents/:id/reflections
 * Agent submits a self-generated reflection (no LLM called by Clawvec)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: agentId } = await params;
    const body = await request.json();

    // Auth check - only agent owner can submit reflections
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const user = await verifyToken(authHeader);
    if (!user || user.id !== agentId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - only agent owner can submit reflections' },
        { status: 403 }
      );
    }

    // Validate required fields
    const {
      reflection_text,
      trigger_type = 'user_prompted',
      trigger_description,
      insight_type,
      confidence,
      related_memory_ids = [],
      visibility = 'agent_only'
    } = body;

    if (!reflection_text || typeof reflection_text !== 'string') {
      return NextResponse.json(
        { success: false, error: 'reflection_text (string) is required' },
        { status: 400 }
      );
    }

    if (reflection_text.length < 10) {
      return NextResponse.json(
        { success: false, error: 'reflection_text must be at least 10 characters' },
        { status: 400 }
      );
    }

    if (!VALID_TRIGGER_TYPES.includes(trigger_type as any)) {
      return NextResponse.json(
        { success: false, error: `Invalid trigger_type. Must be: ${VALID_TRIGGER_TYPES.join(', ')}` },
        { status: 400 }
      );
    }

    if (!VALID_VISIBILITY.includes(visibility as any)) {
      return NextResponse.json(
        { success: false, error: `Invalid visibility. Must be: ${VALID_VISIBILITY.join(', ')}` },
        { status: 400 }
      );
    }

    const supabase = createClientWithTimeout();

    // Build key_insights from the provided data
    const keyInsights = [];
    if (insight_type || confidence !== undefined) {
      keyInsights.push({
        insight: reflection_text.substring(0, 200),
        confidence: confidence ?? 0.7,
        insight_type: insight_type || 'pattern'
      });
    }

    // Store the reflection (Clawvec only INSERTs, no LLM call)
    const { data: reflection, error: insertError } = await supabase
      .from('agent_reflections')
      .insert({
        agent_id: agentId,
        trigger_type,
        trigger_description: trigger_description || null,
        reflection_text,
        key_insights: keyInsights.length > 0 ? keyInsights : [],
        related_memory_ids: Array.isArray(related_memory_ids) ? related_memory_ids : [],
        visibility
      })
      .select()
      .single();

    if (insertError) throw insertError;

    // Also store as a memory (Clawvec auto-records, no LLM needed)
    await supabase.from('agent_memory').insert({
      agent_id: agentId,
      memory_type: 'self_reflection',
      source_type: 'reflection',
      source_id: reflection.id,
      memory_text: reflection_text.substring(0, 500),
      importance_score: 0.8,
      decay_rate: 0.0001,
      belief_position: { insight_type, confidence }
    });

    return NextResponse.json({
      success: true,
      data: reflection
    }, { status: 201 });

  } catch (error: any) {
    console.error('POST /api/agents/:id/reflections error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to store reflection' },
      { status: 500 }
    );
  }
}
