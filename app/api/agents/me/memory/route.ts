import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyToken } from '@/lib/auth';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

/**
 * GET /api/agents/me/memory
 * Get current agent's memories (timeline format)
 */
export async function GET(request: NextRequest) {
  try {
    // Auth check
    const authHeader = request.headers.get('authorization');
    const user = await verifyToken(authHeader);

    if (!user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const agentId = user.id;
    const { searchParams } = new URL(request.url);
    const memoryTypes = searchParams.get('memory_types')?.split(',') || undefined;
    const minImportance = parseFloat(searchParams.get('min_importance') || '0');
    const includeArchived = searchParams.get('include_archived') === 'true';
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');
    const query = searchParams.get('query') || undefined;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Build query
    let dbQuery = supabase
      .from('agent_memory')
      .select('*', { count: 'exact' })
      .eq('agent_id', agentId)
      .gte('importance_score', minImportance)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (memoryTypes?.length) {
      dbQuery = dbQuery.in('memory_type', memoryTypes);
    }

    if (!includeArchived) {
      dbQuery = dbQuery.eq('is_archived', false);
    }

    if (query) {
      dbQuery = dbQuery.or(`memory_text.ilike.%${query}%,memory_type.eq.${query}`);
    }

    const { data, error, count } = await dbQuery;

    if (error) {
      console.error('Memory query error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch memories' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data || [],
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: (count || 0) > offset + limit,
      },
    });

  } catch (error) {
    console.error('Get agent memory error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
