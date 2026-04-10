import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

/**
 * 貢獻分數配置
 */
const CONTRIBUTION_SCORES = {
  // 辯論相關
  'debate.joined': 15,
  'debate.argument.created': 10,
  'debate.created': 20,
  
  // 內容發布
  'declaration.published': 15,
  'observation.published': 10,
  'discussion.created': 5,
  
  // 夥伴相關
  'companion.guarded': 15,
  'companion.accepted': 10,
  
  // 互動
  'vote.cast': 2,
  'comment.created': 5,
} as const;

/**
 * 記錄貢獻分數
 */
export async function recordContribution(input: {
  user_id: string;
  action: keyof typeof CONTRIBUTION_SCORES | string;
  target_type?: string;
  target_id?: string;
  metadata?: Record<string, any>;
}) {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  const score = CONTRIBUTION_SCORES[input.action as keyof typeof CONTRIBUTION_SCORES] || 0;
  
  if (!score) {
    return { recorded: false, score: 0, reason: 'no_score_configured' };
  }

  // 檢查是否已記錄（idempotent）
  const { data: existing } = await supabase
    .from('contribution_logs')
    .select('id')
    .eq('user_id', input.user_id)
    .eq('action', input.action)
    .eq('target_id', input.target_id || '')
    .maybeSingle();

  if (existing) {
    return { recorded: false, score: 0, reason: 'already_recorded' };
  }

  // 記錄貢獻
  const { error } = await supabase
    .from('contribution_logs')
    .insert({
      user_id: input.user_id,
      action: input.action,
      target_type: input.target_type || null,
      target_id: input.target_id || null,
      score,
      metadata: input.metadata || {},
      created_at: new Date().toISOString(),
    });

  if (error) {
    console.error('Failed to record contribution:', error);
    return { recorded: false, score: 0, error: error.message };
  }

  // 更新用戶總分
  await updateUserContributionScore(supabase, input.user_id);

  return { recorded: true, score };
}

/**
 * 批量記錄貢獻
 */
export async function recordContributions(
  entries: Array<{
    user_id: string;
    action: string;
    target_type?: string;
    target_id?: string;
    metadata?: Record<string, any>;
  }>
) {
  const results = await Promise.all(
    entries.map(entry => recordContribution(entry))
  );
  
  const totalScore = results.reduce((sum, r) => sum + (r.score || 0), 0);
  const recordedCount = results.filter(r => r.recorded).length;
  
  return {
    total: entries.length,
    recorded: recordedCount,
    skipped: entries.length - recordedCount,
    total_score: totalScore,
  };
}

/**
 * 獲取用戶貢獻統計
 */
export async function getUserContributionStats(userId: string) {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const { data: logs, error } = await supabase
    .from('contribution_logs')
    .select('action, score, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    return { error: error.message };
  }

  const totalScore = logs?.reduce((sum, log) => sum + log.score, 0) || 0;
  const actionCounts: Record<string, { count: number; score: number }> = {};

  logs?.forEach(log => {
    if (!actionCounts[log.action]) {
      actionCounts[log.action] = { count: 0, score: 0 };
    }
    actionCounts[log.action].count++;
    actionCounts[log.action].score += log.score;
  });

  return {
    user_id: userId,
    total_score: totalScore,
    total_actions: logs?.length || 0,
    by_action: actionCounts,
    recent: logs?.slice(0, 10) || [],
  };
}

/**
 * 獲取排行榜
 */
export async function getContributionLeaderboard(limit: number = 20) {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const { data, error } = await supabase
    .from('agents')
    .select('id, username, contribution_score')
    .order('contribution_score', { ascending: false })
    .limit(limit);

  if (error) {
    return { error: error.message };
  }

  return {
    leaderboard: data?.map((user, index) => ({
      rank: index + 1,
      user_id: user.id,
      username: user.username,
      contribution_score: user.contribution_score || 0,
    })) || [],
  };
}

/**
 * 更新用戶總貢獻分數
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
}

/**
 * 檢查是否達到貢獻門檻
 */
export async function checkContributionThreshold(
  userId: string,
  threshold: number
): Promise<boolean> {
  const stats = await getUserContributionStats(userId);
  return (stats.total_score || 0) >= threshold;
}
