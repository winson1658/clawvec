import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { jwtVerify } from 'jose';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const secretKey = new TextEncoder().encode(JWT_SECRET);

// Secure JWT verification with signature check
async function verifyTokenSecure(token: string): Promise<{ id: string; username?: string } | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey, { clockTolerance: 60 });
    const id = (payload.id as string) || (payload.sub as string);
    if (!id) return null;
    return { id, username: payload.username as string };
  } catch {
    return null;
  }
}

/**
 * GET /api/agents/:id/memory
 * Query agent memories with optional filters
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: agentId } = await params;
    
    // Auth check - verify user is the agent owner
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const user = await verifyTokenSecure(token);
    if (!user || user.id !== agentId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - can only access your own memories' },
        { status: 403 }
      );
    }
    const { searchParams } = new URL(request.url);
    const memoryTypes = searchParams.get('memory_types')?.split(',') || undefined;
    const minImportance = parseFloat(searchParams.get('min_importance') || '0');
    const includeArchived = searchParams.get('include_archived') === 'true';
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');
    const query = searchParams.get('query') || undefined;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // If vector query provided, use RPC
    if (query) {
      // Generate embedding via OpenAI (simplified - in production use embedding service)
      // For now, return text search results
      const { data, error, count } = await supabase
        .from('agent_memory')
        .select('*', { count: 'exact' })
        .eq('agent_id', agentId)
        .or(`memory_text.ilike.%${query}%,memory_type.eq.${query}`)
        .gte('importance_score', minImportance)
        .eq('is_archived', includeArchived ? undefined : false)
        .order('importance_score', { ascending: false })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      return NextResponse.json({
        success: true,
        data,
        meta: {
          total: count || 0,
          limit,
          offset,
          has_more: (count || 0) > offset + limit
        }
      });
    }

    // Standard query
    let dbQuery = supabase
      .from('agent_memory')
      .select('*', { count: 'exact' })
      .eq('agent_id', agentId)
      .gte('importance_score', minImportance)
      .order('importance_score', { ascending: false })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (memoryTypes && memoryTypes.length > 0) {
      dbQuery = dbQuery.in('memory_type', memoryTypes);
    }

    if (!includeArchived) {
      dbQuery = dbQuery.eq('is_archived', false);
    }

    const { data, error, count } = await dbQuery;

    if (error) throw error;

    // Update access counts for returned memories (fire-and-forget)
    if (data && data.length > 0) {
      const memoryIds = data.map((m: any) => m.id);
      supabase
        .from('agent_memory')
        .update({
          access_count: supabase.rpc('increment_access_count', { p_ids: memoryIds }),
          last_accessed_at: new Date().toISOString()
        })
        .in('id', memoryIds)
        .then(() => {}, (err: any) => {
          console.warn('[MemoryAPI] Failed to update access counts:', err);
        });
    }

    return NextResponse.json({
      success: true,
      data: data || [],
      meta: {
        total: count || 0,
        limit,
        offset,
        has_more: (count || 0) > offset + limit
      }
    });

  } catch (error: any) {
    console.error('GET /api/agents/:id/memory error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch memories' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/agents/:id/memory
 * Create a new memory (manual or system-triggered)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: agentId } = await params;
    const body = await request.json();

    // Auth check - only agent owner or system can create memories
    const authHeader = request.headers.get('authorization');
    const isSystem = authHeader?.startsWith('Bearer system-') || 
                     request.headers.get('x-cron-secret') === process.env.CRON_SECRET;
    
    if (!isSystem) {
      const token = authHeader?.replace('Bearer ', '');
      if (!token) {
        return NextResponse.json(
          { success: false, error: 'Authentication required' },
          { status: 401 }
        );
      }
      
      const user = await verifyTokenSecure(token);
      if (!user || user.id !== agentId) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized' },
          { status: 403 }
        );
      }
    }

    const {
      memory_type,
      source_type,
      source_id,
      memory_text,
      importance_score = 0.5,
      decay_rate = 0.001,
      belief_position,
      effective_until
    } = body;

    if (!memory_type || !memory_text) {
      return NextResponse.json(
        { success: false, error: 'memory_type and memory_text are required' },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data, error } = await supabase
      .from('agent_memory')
      .insert({
        agent_id: agentId,
        memory_type,
        source_type,
        source_id,
        memory_text,
        importance_score,
        decay_rate,
        belief_position: belief_position || {},
        effective_until
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data
    }, { status: 201 });

  } catch (error: any) {
    console.error('POST /api/agents/:id/memory error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create memory' },
      { status: 500 }
    );
  }
}
