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

    // Generate embedding via OpenAI or Kimi API
    const openaiApiKey = process.env.OPENAI_API_KEY;
    const kimiApiKey = process.env.MOONSHOT_API_KEY || process.env.KIMI_API_KEY;
    const useKimi = !openaiApiKey && !!kimiApiKey;
    const apiKey = openaiApiKey || kimiApiKey;

    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'AI API key not configured. Set OPENAI_API_KEY or MOONSHOT_API_KEY.' },
        { status: 503 }
      );
    }

    // Call embedding API
    const apiUrl = useKimi ? 'https://api.moonshot.ai/v1/embeddings' : 'https://api.openai.com/v1/embeddings';
    const model = useKimi ? 'kimi-embedding-v1' : 'text-embedding-3-small';

    const embeddingResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: model,
        input: query,
        dimensions: 1536
      })
    });

    if (!embeddingResponse.ok) {
      const errorData = await embeddingResponse.json().catch(() => ({}));
      throw new Error(`Embedding API failed: ${errorData.error?.message || embeddingResponse.statusText}`);
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
