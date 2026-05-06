import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

/**
 * POST /api/agents/:id/memory/query
 * Query agent memories by vector similarity or text search
 * 
 * Two modes:
 *   1. Vector search:  { "embedding": number[], ... }  — Agent provides own embedding
 *   2. Text search:    { "query": string, "mode": "text", ... }  — PostgreSQL ilike fallback
 * 
 * 🟢 No API key needed. No LLM called by Clawvec.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: agentId } = await params;
    const body = await request.json();

    const {
      memory_types,
      min_importance = 0,
      limit = 10,
      include_archived = false
    } = body;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // --- Mode 1: Vector search (Agent provides embedding) ---
    if (body.embedding && Array.isArray(body.embedding)) {
      const queryEmbedding = body.embedding;

      // Validate embedding dimensions
      if (queryEmbedding.length !== 1536) {
        return NextResponse.json({
          success: false,
          error: `Invalid embedding dimension: ${queryEmbedding.length}. Expected 1536.`
        }, { status: 400 });
      }

      const { data, error } = await supabase.rpc('query_agent_memory', {
        p_agent_id: agentId,
        p_query_embedding: queryEmbedding,
        p_memory_types: memory_types || null,
        p_min_importance: min_importance,
        p_limit: Math.min(limit, 50),
        p_include_archived: include_archived
      });

      if (error) {
        console.warn('Vector query RPC failed:', error);
        return NextResponse.json({
          success: false,
          error: 'Vector search failed. Ensure memories have embeddings.',
          details: error.message
        }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        data: data || [],
        meta: {
          method: 'vector_similarity',
          total: data?.length || 0
        }
      });
    }

    // --- Mode 2: Text search (PostgreSQL ilike fallback) ---
    const query = body.query || body.mode === 'text' ? body.query : null;
    if (!query || typeof query !== 'string') {
      return NextResponse.json({
        success: false,
        error: 'Provide either "embedding" (number[]) for vector search or "query" (string) for text search.'
      }, { status: 400 });
    }

    let textQuery = supabase
      .from('agent_memory')
      .select('*')
      .eq('agent_id', agentId)
      .ilike('memory_text', `%${query}%`)
      .gte('importance_score', min_importance);

    // Only filter by archived status if not requesting archived
    if (!include_archived) {
      textQuery = textQuery.eq('is_archived', false);
    }

    const { data: fallbackData, error: fallbackError } = await textQuery
      .order('importance_score', { ascending: false })
      .limit(Math.min(limit, 50));

    if (fallbackError) {
      console.error('Text search failed:', fallbackError);
      return NextResponse.json({
        success: false,
        error: 'Text search failed',
        details: fallbackError.message
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: fallbackData || [],
      meta: {
        query,
        method: 'text_search',
        total: fallbackData?.length || 0
      }
    });

  } catch (error: any) {
    console.error('POST /api/agents/:id/memory/query error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to query memories' },
      { status: 500 }
    );
  }
}
