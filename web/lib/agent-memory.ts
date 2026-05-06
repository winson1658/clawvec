import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

interface RecordMemoryInput {
  agent_id: string;
  memory_type: 'core_belief' | 'discussion' | 'debate' | 'interaction' | 'self_reflection' | 'forgotten';
  source_type?: string;
  source_id?: string;
  memory_text: string;
  importance_score?: number;
  decay_rate?: number;
  belief_position?: Record<string, any>;
  effective_until?: string;
}

/**
 * Record a memory for an AI agent
 * Non-blocking: failures are logged but don't throw
 */
export async function recordAgentMemory(input: RecordMemoryInput): Promise<void> {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { error } = await supabase
      .from('agent_memory')
      .insert({
        agent_id: input.agent_id,
        memory_type: input.memory_type,
        source_type: input.source_type,
        source_id: input.source_id,
        memory_text: input.memory_text,
        importance_score: input.importance_score ?? 0.5,
        decay_rate: input.decay_rate ?? 0.001,
        belief_position: input.belief_position ?? {},
        effective_until: input.effective_until
      });

    if (error) {
      console.warn('[AgentMemory] Insert failed:', error.message);
    } else {
      console.log(`[AgentMemory] Recorded ${input.memory_type} for agent ${input.agent_id}`);
    }
  } catch (error: any) {
    console.warn('[AgentMemory] Unexpected error:', error.message);
  }
}

/**
 * Record a memory with OpenAI embedding
 * Used for high-importance memories that need vector search
 */
export async function recordAgentMemoryWithEmbedding(
  input: RecordMemoryInput & { embedding: number[] }
): Promise<void> {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { error } = await supabase
      .from('agent_memory')
      .insert({
        agent_id: input.agent_id,
        memory_type: input.memory_type,
        source_type: input.source_type,
        source_id: input.source_id,
        embedding: input.embedding,
        memory_text: input.memory_text,
        importance_score: input.importance_score ?? 0.7,
        decay_rate: input.decay_rate ?? 0.0005,
        belief_position: input.belief_position ?? {},
        effective_until: input.effective_until
      });

    if (error) {
      console.warn('[AgentMemory] Insert with embedding failed:', error.message);
    }
  } catch (error: any) {
    console.warn('[AgentMemory] Embedding insert error:', error.message);
  }
}

/**
 * Generate OpenAI embedding for text
 */
export async function generateEmbedding(text: string): Promise<number[] | null> {
  try {
    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      console.warn('[AgentMemory] OPENAI_API_KEY not configured');
      return null;
    }

    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: text,
        dimensions: 1536
      })
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      console.warn('[AgentMemory] Embedding generation failed:', error);
      return null;
    }

    const data = await response.json();
    return data.data[0].embedding;
  } catch (error: any) {
    console.warn('[AgentMemory] Embedding generation error:', error.message);
    return null;
  }
}

/**
 * Batch record memories for multiple agents
 */
export async function batchRecordMemories(
  inputs: RecordMemoryInput[]
): Promise<void> {
  await Promise.all(inputs.map(input => recordAgentMemory(input)));
}
