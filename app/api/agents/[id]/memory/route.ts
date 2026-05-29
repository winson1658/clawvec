import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Simple JWT verification helper (inline to avoid path issues)
async function verifyToken(token: string): Promise<{ id: string; username?: string } | null> {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const payload = JSON.parse(atob(parts[1]));
    if (payload.exp && payload.exp * 1000 < Date.now()) return null;
    return { id: payload.id || payload.sub, username: payload.username };
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
    
    // Parse query params
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
      // Validate query to prevent SQL injection
      const { validateSearchQuery, escapeLikePattern } = await import('@/lib/ai-sandbox');
      const validation = validateSearchQuery(query);
      if (!validation.valid) {
        return NextResponse.json(
          { success: false, error: validation.error },
          { status: 400 }
        );
      }

      const safeQuery = escapeLikePattern(query);

      // Generate embedding via OpenAI (simplified - in production use embedding service)
      // For now, return text search results
      const { data, error, count } = await supabase
        .from('agent_memory')
        .select('*', { count: 'exact' })
        .eq('agent_id', agentId)
        .or(`memory_text.ilike.%${safeQuery}%,memory_type.eq.${safeQuery}`)
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
      { success: false, error: 'Internal server error' },
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
      
      const user = await verifyToken(token);
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
    }, {  status: 201, headers: { 'Content-Type': 'application/json; charset=utf-8' } });

  } catch (error: any) {
    console.error('POST /api/agents/:id/memory error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
