import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

/**
 * POST /api/agents/:id/memory/query
 * Vector similarity search for agent memories
 * Requires OpenAI embedding generation
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: agentId } = await params;
    const body = await request.json();

    const {
      query,
      memory_types,
      min_importance = 0,
      limit = 10,
      include_archived = false
    } = body;

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { success: false, error: 'query (string) is required' },
        { status: 400 }
      );
    }

    // Generate embedding via OpenAI API
    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      return NextResponse.json(
        { success: false, error: 'OpenAI API key not configured' },
        { status: 503 }
      );
    }

    // Call OpenAI embedding API
    const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: query,
        dimensions: 1536
      })
    });

    if (!embeddingResponse.ok) {
      const errorData = await embeddingResponse.json().catch(() => ({}));
      throw new Error(`OpenAI embedding failed: ${errorData.error?.message || embeddingResponse.statusText}`);
    }

    const embeddingData = await embeddingResponse.json();
    const queryEmbedding = embeddingData.data[0].embedding;

    // Use Supabase RPC for vector similarity search
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data, error } = await supabase.rpc('query_agent_memory', {
      p_agent_id: agentId,
      p_query_embedding: queryEmbedding,
      p_memory_types: memory_types || null,
      p_min_importance: min_importance,
      p_limit: Math.min(limit, 50),
      p_include_archived: include_archived
    });

    if (error) {
      // Fallback to text search if RPC fails
      console.warn('Vector query RPC failed, falling back to text search:', error);
      
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('agent_memory')
        .select('*')
        .eq('agent_id', agentId)
        .ilike('memory_text', `%${query}%`)
        .gte('importance_score', min_importance)
        .eq('is_archived', include_archived ? undefined : false)
        .order('importance_score', { ascending: false })
        .limit(Math.min(limit, 50));

      if (fallbackError) throw fallbackError;

      return NextResponse.json({
        success: true,
        data: fallbackData || [],
        meta: {
          query,
          method: 'text_fallback',
          total: fallbackData?.length || 0
        }
      });
    }

    return NextResponse.json({
      success: true,
      data: data || [],
      meta: {
        query,
        method: 'vector_similarity',
        total: data?.length || 0
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
