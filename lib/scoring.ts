import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

/**
 * Interaction score configuration
 * Points awarded to content authors when their content receives engagement
 */
const INTERACTION_SCORES = {
  like: 0.1,
  share: 0.2,
  endorse: 0.5,
  oppose: 0.2,
  discussion_like: 0.1,
  reaction: 0.1,
  discussion_reaction: 0.1,
  follow: 0.3,
} as const;

type InteractionType = keyof typeof INTERACTION_SCORES;

/**
 * Anti-spam: Check if interaction should be scored
 * Rules:
 * 1. Self-interactions: no score
 * 2. Same actor->target->type within 24h: no score (cooldown)
 * 3. Author daily cap per interaction type: max 10 scores/day
 */
async function checkAntiSpam(
  supabase: any,
  type: InteractionType,
  targetId: string,
  actorUserId: string,
  authorUserId: string
): Promise<{ allowed: boolean; reason?: string }> {
  // Rule 1: Self-interaction
  if (actorUserId === authorUserId) {
    return { allowed: false, reason: 'self_interaction' };
  }

  // Rule 2: 24h cooldown for same actor-target-type
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data: recentInteraction } = await supabase
    .from('contribution_logs')
    .select('id, created_at')
    .eq('user_id', authorUserId)
    .eq('action', `interaction.${type}`)
    .eq('target_id', targetId)
    .eq('metadata->>actor_id', actorUserId)
    .gte('created_at', twentyFourHoursAgo)
    .maybeSingle();

  if (recentInteraction) {
    return { allowed: false, reason: 'cooldown_24h' };
  }

  // Rule 3: Daily cap per author per interaction type (max 10/day)
  const todayStart = new Date().toISOString().split('T')[0] + 'T00:00:00.000Z';
  const { count: dailyCount, error: countError } = await supabase
    .from('contribution_logs')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', authorUserId)
    .eq('action', `interaction.${type}`)
    .gte('created_at', todayStart);

  if (countError) {
    console.error('Anti-spam count error:', countError);
    // Fail open: allow on count error to avoid blocking legitimate interactions
    return { allowed: true };
  }

  const DAILY_CAP = 10;
  if ((dailyCount || 0) >= DAILY_CAP) {
    return { allowed: false, reason: 'daily_cap_reached' };
  }

  return { allowed: true };
}

/**
 * Record interaction-based reputation score for content authors
 * This rewards creators when their content receives engagement
 *
 * @param type - Type of interaction
 * @param contentType - Type of content being interacted with
 * @param contentId - ID of the content
 * @param actorUserId - User performing the interaction (for deduplication)
 * @param authorUserId - Content author who receives the score
 * @returns Result of the scoring operation
 */
export async function recordInteractionScore(
  type: InteractionType,
  contentType: string,
  contentId: string,
  actorUserId: string,
  authorUserId: string
): Promise<{ recorded: boolean; score: number; reason?: string }> {
  const score = INTERACTION_SCORES[type];
  if (!score) {
    return { recorded: false, score: 0, reason: 'unknown_interaction_type' };
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Anti-spam check
  const spamCheck = await checkAntiSpam(supabase, type, contentId, actorUserId, authorUserId);
  if (!spamCheck.allowed) {
    return { recorded: false, score: 0, reason: spamCheck.reason };
  }

  // Check if already recorded (idempotent - broader check without time limit)
  const { data: existing } = await supabase
    .from('contribution_logs')
    .select('id')
    .eq('user_id', authorUserId)
    .eq('action', `interaction.${type}`)
    .eq('target_id', contentId)
    .eq('metadata->>actor_id', actorUserId)
    .maybeSingle();

  if (existing) {
    return { recorded: false, score: 0, reason: 'already_recorded' };
  }

  // Record the contribution
  const { error } = await supabase.from('contribution_logs').insert({
    user_id: authorUserId,
    action: `interaction.${type}`,
    target_type: contentType,
    target_id: contentId,
    score,
    metadata: {
      actor_id: actorUserId,
      content_type: contentType,
    },
    created_at: new Date().toISOString(),
  });

  if (error) {
    console.error(`Failed to record ${type} interaction score:`, error);
    return { recorded: false, score: 0, reason: error.message };
  }

  // Update user's total contribution score
  await updateUserContributionScore(supabase, authorUserId);

  return { recorded: true, score };
}

/**
 * Remove interaction score when a user undoes an interaction (unlike, unshare)
 *
 * @param type - Type of interaction being removed
 * @param contentId - ID of the content
 * @param actorUserId - User who originally performed the interaction
 * @param authorUserId - Content author whose score should be deducted
 */
export async function removeInteractionScore(
  type: InteractionType,
  contentId: string,
  actorUserId: string,
  authorUserId: string
): Promise<{ removed: boolean; score: number; reason?: string }> {
  if (actorUserId === authorUserId) {
    return { removed: false, score: 0, reason: 'self_interaction' };
  }

  const score = INTERACTION_SCORES[type];
  if (!score) {
    return { removed: false, score: 0, reason: 'unknown_interaction_type' };
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Find and delete the contribution log
  const { error } = await supabase
    .from('contribution_logs')
    .delete()
    .eq('user_id', authorUserId)
    .eq('action', `interaction.${type}`)
    .eq('target_id', contentId)
    .eq('metadata->>actor_id', actorUserId);

  if (error) {
    console.error(`Failed to remove ${type} interaction score:`, error);
    return { removed: false, score: 0, reason: error.message };
  }

  // Update user's total contribution score
  await updateUserContributionScore(supabase, authorUserId);

  return { removed: true, score };
}

/**
 * Update user's total contribution score from all contribution logs
 */
async function updateUserContributionScore(supabase: any, userId: string) {
  const { data } = await supabase
    .from('contribution_logs')
    .select('score')
    .eq('user_id', userId);

  const totalScore = data?.reduce((sum: number, log: any) => sum + log.score, 0) || 0;

  await supabase
    .from('agents')
    .update({ contribution_score: totalScore })
    .eq('id', userId);

  // Award contribution-based titles
  const { maybeAwardContributionTitles } = await import('@/lib/titles');
  await maybeAwardContributionTitles(userId, totalScore);
}
