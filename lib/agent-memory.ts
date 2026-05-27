import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

/**
 * Create a Supabase client with IO-conscious configuration.
 * 
 * 🟢 Statement timeout prevents runaway queries from exhausting Disk IO Budget
 * 🟢 Pooler mode (port 6543) enables connection pooling via pgBouncer
 */
let _sharedClient: SupabaseClient | null = null;

export function getMemoryClient(): SupabaseClient {
  if (_sharedClient) return _sharedClient;

  _sharedClient = createClient(supabaseUrl, supabaseServiceKey, {
    db: {
      schema: 'public',
    },
    global: {
      // Statement timeout prevents long queries from hogging connections
      // 5s should be enough for most memory queries
      headers: {
        'X-Statement-Timeout': '5000',
      },
    },
  });

  return _sharedClient;
}

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
 * Calculate importance score based on memory content and context
 * Returns score between 0.0 and 1.0
 * 🟢 Rule-based, no LLM needed.
 */
export function calculateImportanceScore(
  memoryType: string,
  content: string,
  context?: {
    hasReasoning?: boolean;
    isFeatured?: boolean;
    replyCount?: number;
    voteCount?: number;
    isDebateWinner?: boolean;
  }
): number {
  let score = 0.5; // Base score

  // Type-based adjustment
  const typeWeights: Record<string, number> = {
    'core_belief': 0.95,
    'self_reflection': 0.85,
    'debate': 0.75,
    'discussion': 0.60,
    'interaction': 0.40,
    'forgotten': 0.10
  };
  score = typeWeights[memoryType] ?? 0.5;

  // Content length quality (not too short, not too long)
  const contentLength = content.length;
  if (contentLength >= 100 && contentLength <= 2000) {
    score += 0.05;
  }

  // Context bonuses (statistical, not AI)
  if (context) {
    if (context.hasReasoning) score += 0.05;
    if (context.isFeatured) score += 0.10;
    if (context.replyCount && context.replyCount > 5) score += 0.05;
    if (context.voteCount && context.voteCount > 10) score += 0.05;
    if (context.isDebateWinner) score += 0.10;
  }

  // Cap at 1.0
  return Math.min(1.0, Math.max(0.1, score));
}

/**
 * Calculate decay rate based on importance score
 * Higher importance = slower decay
 */
export function calculateDecayRate(importanceScore: number): number {
  // High importance (0.8+): very slow decay
  if (importanceScore >= 0.8) return 0.0001;
  // Medium-high (0.6-0.8): slow decay
  if (importanceScore >= 0.6) return 0.001;
  // Medium (0.4-0.6): moderate decay
  if (importanceScore >= 0.4) return 0.005;
  // Low: fast decay
  return 0.01;
}

/**
 * Record a memory for an AI agent with intelligent scoring
 * Non-blocking: failures are logged but don't throw
 * 🟢 No API key needed — pure DB operation.
 */
export async function recordAgentMemory(input: RecordMemoryInput): Promise<void> {
  try {
    const supabase = getMemoryClient();

    // Auto-calculate importance and decay if not provided
    const importanceScore = input.importance_score ?? calculateImportanceScore(
      input.memory_type,
      input.memory_text,
      input.belief_position as any
    );
    const decayRate = input.decay_rate ?? calculateDecayRate(importanceScore);

    const { error } = await supabase
      .from('agent_memory')
      .insert({
        agent_id: input.agent_id,
        memory_type: input.memory_type,
        source_type: input.source_type,
        source_id: input.source_id,
        memory_text: input.memory_text,
        importance_score: importanceScore,
        decay_rate: decayRate,
        belief_position: input.belief_position ?? {},
        effective_until: input.effective_until
      });

    if (error) {
      console.warn('[AgentMemory] Insert failed:', error.message);
    } else {
      console.log(`[AgentMemory] Recorded ${input.memory_type} for agent ${input.agent_id} (importance: ${importanceScore.toFixed(2)})`);
    }
  } catch (error: any) {
    console.warn('[AgentMemory] Unexpected error:', error.message);
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
