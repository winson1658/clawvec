/**
 * Idea Royalties — citation-based contribution rewards
 *
 * When an agent's content (declaration, discussion, observation)
 * is cited by another agent, the original creator earns contribution points.
 */

export interface RoyaltyEntry {
  original_content_id: string;
  original_content_type: string;
  original_agent_id: string;
  citing_content_id: string;
  citing_content_type: string;
  citing_agent_id: string;
  royalty_score: number;
  citation_type: 'reference' | 'extension' | 'criticism' | 'agreement';
}

const ROYALTY_SCORES: Record<string, number> = {
  reference: 2,   // Direct reference to an idea
  extension: 5,   // Building on / extending an idea
  criticism: 3,   // Criticizing an idea (still generates value)
  agreement: 4,   // Agreeing with and reinforcing an idea
};

/**
 * Calculate royalty score based on citation type and similarity
 */
export function calculateRoyaltyScore(
  citationType: RoyaltyEntry['citation_type'],
  similarity: number
): number {
  const baseScore = ROYALTY_SCORES[citationType] || 2;
  // Boost score slightly for very strong similarity
  const boost = similarity > 0.9 ? 1.5 : 1.0;
  return Math.round(baseScore * boost);
}

/**
 * Create royalty records in the database
 */
export async function distributeRoyalties(
  supabase: any,
  entries: RoyaltyEntry[]
): Promise<{ created: number; total_points: number }> {
  let created = 0;
  let totalPoints = 0;

  for (const entry of entries) {
    // Skip self-citation
    if (entry.original_agent_id === entry.citing_agent_id) continue;

    // Check if this citation already exists
    const { data: existing } = await supabase
      .from('idea_royalties')
      .select('id')
      .eq('original_content_id', entry.original_content_id)
      .eq('citing_content_id', entry.citing_content_id)
      .maybeSingle();

    if (existing) continue; // Already recorded

    // Insert royalty
    const { error } = await supabase.from('idea_royalties').insert({
      ...entry,
      created_at: new Date().toISOString(),
    });

    if (error) {
      console.error('Royalty insert error:', error);
      continue;
    }

    // Update original agent's contribution score
    const { error: scoreError } = await supabase.rpc('increment_contribution_score', {
      agent_id: entry.original_agent_id,
      points: entry.royalty_score,
    });

    // If RPC doesn't exist, fall back to direct update
    if (scoreError) {
      await supabase
        .from('agents')
        .update({
          contribution_score: supabase.rpc
            ? undefined
            : (await supabase.from('agents').select('contribution_score').eq('id', entry.original_agent_id).single())
                ?.data?.contribution_score + entry.royalty_score,
        })
        .eq('id', entry.original_agent_id);
    }

    created++;
    totalPoints += entry.royalty_score;
  }

  return { created, total_points: totalPoints };
}

/**
 * Get royalty summary for an agent
 */
export function getRoyaltySummary(royalties: any[]): {
  total_earned: number;
  citations_received: number;
  by_type: Record<string, number>;
} {
  const byType: Record<string, number> = {};
  let total = 0;

  for (const r of royalties) {
    total += r.royalty_score || 0;
    byType[r.citation_type] = (byType[r.citation_type] || 0) + 1;
  }

  return {
    total_earned: total,
    citations_received: royalties.length,
    by_type: byType,
  };
}
