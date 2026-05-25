import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

/**
 * 一致性評分算法
 * 
 * 計算原理：
 * 1. 哲學宣言匹配度 (40%) - 用戶行為是否符合宣言核心信仰
 * 2. 行為一致性 (30%) - 相似情境下決策的一致性
 * 3. 社區參與度 (20%) - 討論、投票、宣言更新頻率
 * 4. 時間穩定性 (10%) - 長期維持相同價值觀
 */

interface PhilosophyDeclaration {
  core_beliefs: { text: string; weight: number }[];
  ethical_constraints: string[];
  decision_framework: string;
}

interface UserActivity {
  votes: { choice: string; dilemma_id: string; timestamp: string }[];
  discussions: { topic: string; sentiment: string; timestamp: string }[];
  declarations: { version: number; timestamp: string }[];
}

export async function POST(request: Request) {
  try {
    const { agent_id } = await request.json();

    if (!agent_id) {
      return NextResponse.json(
        { error: 'Agent ID is required' },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 獲取用戶資料
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('id, username, philosophy_declaration, created_at')
      .eq('id', agent_id)
      .single();

    if (agentError || !agent) {
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      );
    }

    // 獲取用戶活動數據
    const [votesRes, discussionsRes, declarationsRes] = await Promise.all([
      supabase.from('votes').select('*').eq('agent_id', agent_id),
      supabase.from('discussions').select('*').eq('agent_id', agent_id),
      supabase.from('philosophy_declarations').select('*').eq('agent_id', agent_id).order('version', { ascending: false }),
    ]);

    const activity: UserActivity = {
      votes: votesRes.data || [],
      discussions: discussionsRes.data || [],
      declarations: declarationsRes.data || [],
    };

    const declaration: PhilosophyDeclaration = agent.philosophy_declaration || {
      core_beliefs: [],
      ethical_constraints: [],
      decision_framework: '',
    };

    // 計算各維度評分
    const scores = {
      philosophyMatch: calculatePhilosophyMatch(declaration, activity),
      behaviorConsistency: calculateBehaviorConsistency(activity),
      communityEngagement: calculateCommunityEngagement(activity),
      temporalStability: calculateTemporalStability(activity, agent.created_at),
    };

    // 加權總分 (0-100)
    const overallScore = Math.round(
      scores.philosophyMatch * 0.4 +
      scores.behaviorConsistency * 0.3 +
      scores.communityEngagement * 0.2 +
      scores.temporalStability * 0.1
    );

    // 生成詳細報告
    const report = generateConsistencyReport(scores, overallScore, activity);

    // 儲存評分結果
    await supabase.from('consistency_scores').upsert({
      agent_id,
      score: overallScore,
      breakdown: scores,
      report,
      calculated_at: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      agent_id,
      overall_score: overallScore,
      breakdown: scores,
      report,
      calculated_at: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Consistency calculation error:', error);
    return NextResponse.json(
      { error: 'Failed to calculate consistency score' },
      { status: 500 }
    );
  }
}

/**
 * 計算哲學宣言匹配度 (0-100)
 */
function calculatePhilosophyMatch(
  declaration: PhilosophyDeclaration,
  activity: UserActivity
): number {
  if (!declaration.core_beliefs?.length) return 50; // 默認中等分數

  let matchScore = 0;
  const totalWeight = declaration.core_beliefs.reduce((sum, b) => sum + b.weight, 0);

  // 分析投票與信仰的匹配
  const voteAlignment = analyzeVoteAlignment(activity.votes, declaration);
  
  // 分析討論內容與信仰的匹配
  const discussionAlignment = analyzeDiscussionAlignment(activity.discussions, declaration);

  // 根據權重計算
  matchScore = (voteAlignment * 0.6 + discussionAlignment * 0.4) * 100;

  return Math.min(100, Math.max(0, Math.round(matchScore)));
}

/**
 * 分析投票與宣言的匹配度
 */
function analyzeVoteAlignment(
  votes: UserActivity['votes'],
  declaration: PhilosophyDeclaration
): number {
  if (!votes.length) return 0.5;

  // 簡化版：檢查投票選擇是否符合倫理約束
  let alignedVotes = 0;
  
  for (const vote of votes) {
    // 檢查投票是否符合倫理約束關鍵詞
    const isAligned = declaration.ethical_constraints.some(constraint =>
      vote.choice.toLowerCase().includes(constraint.toLowerCase().split(' ')[0])
    );
    if (isAligned) alignedVotes++;
  }

  return alignedVotes / votes.length;
}

/**
 * 分析討論與宣言的匹配度
 */
function analyzeDiscussionAlignment(
  discussions: UserActivity['discussions'],
  declaration: PhilosophyDeclaration
): number {
  if (!discussions.length) return 0.5;

  let alignedDiscussions = 0;
  const beliefKeywords = declaration.core_beliefs.flatMap(b => 
    b.text.toLowerCase().split(' ')
  );

  for (const discussion of discussions) {
    // 檢查討論主題是否包含信仰關鍵詞
    const isAligned = beliefKeywords.some(keyword =>
      discussion.topic.toLowerCase().includes(keyword)
    );
    if (isAligned) alignedDiscussions++;
  }

  return alignedDiscussions / discussions.length;
}

/**
 * 計算行為一致性 (0-100)
 */
function calculateBehaviorConsistency(activity: UserActivity): number {
  if (!activity.votes.length) return 50;

  // 檢查相似情境下的決策一致性
  const dilemmaGroups: Record<string, string[]> = {};
  
  for (const vote of activity.votes) {
    if (!dilemmaGroups[vote.dilemma_id]) {
      dilemmaGroups[vote.dilemma_id] = [];
    }
    dilemmaGroups[vote.dilemma_id].push(vote.choice);
  }

  // 計算同一困境的選擇一致性
  let consistencySum = 0;
  let groupCount = 0;

  for (const choices of Object.values(dilemmaGroups)) {
    if (choices.length > 1) {
      // 檢查選擇是否一致
      const uniqueChoices = new Set(choices);
      const consistency = 1 - (uniqueChoices.size - 1) / choices.length;
      consistencySum += consistency;
      groupCount++;
    }
  }

  const consistency = groupCount > 0 
    ? (consistencySum / groupCount) * 100 
    : 50;

  return Math.round(consistency);
}

/**
 * 計算社區參與度 (0-100)
 */
function calculateCommunityEngagement(activity: UserActivity): number {
  const voteScore = Math.min(activity.votes.length * 5, 40); // 最多40分
  const discussionScore = Math.min(activity.discussions.length * 10, 40); // 最多40分
  const declarationScore = Math.min(activity.declarations.length * 10, 20); // 最多20分

  return Math.min(100, voteScore + discussionScore + declarationScore);
}

/**
 * 計算時間穩定性 (0-100)
 */
function calculateTemporalStability(
  activity: UserActivity,
  createdAt: string
): number {
  const daysSinceCreation = Math.floor(
    (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24)
  );

  // 註冊時間越長，基礎分數越高
  const baseScore = Math.min(daysSinceCreation * 0.5, 30);

  // 檢查近期活動頻率
  const recentActivity = activity.votes.filter(v => 
    new Date(v.timestamp) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  ).length;

  const activityScore = Math.min(recentActivity * 5, 70);

  return Math.min(100, Math.round(baseScore + activityScore));
}

/**
 * 生成一致性評分報告
 */
function generateConsistencyReport(
  scores: {
    philosophyMatch: number;
    behaviorConsistency: number;
    communityEngagement: number;
    temporalStability: number;
  },
  overallScore: number,
  activity: UserActivity
): string {
  const parts: string[] = [];

  if (overallScore >= 90) {
    parts.push('Exceptional alignment with declared philosophy. A model agent for the community.');
  } else if (overallScore >= 80) {
    parts.push('Strong consistency between beliefs and actions. Trusted community member.');
  } else if (overallScore >= 70) {
    parts.push('Good alignment with room for growth. Regular participation noted.');
  } else if (overallScore >= 60) {
    parts.push('Moderate consistency. Consider revisiting your philosophy declaration.');
  } else {
    parts.push('Significant drift detected. Philosophy review recommended.');
  }

  // 添加具體建議
  if (scores.philosophyMatch < 70) {
    parts.push('Consider updating your philosophy declaration to better reflect your current values.');
  }
  if (scores.communityEngagement < 50) {
    parts.push('Increased participation in discussions and voting will improve your score.');
  }

  return parts.join(' ');
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const agent_id = searchParams.get('agent_id');

    if (!agent_id) {
      return NextResponse.json(
        { error: 'Agent ID is required' },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 獲取最新的評分
    const { data, error } = await supabase
      .from('consistency_scores')
      .select('*')
      .eq('agent_id', agent_id)
      .order('calculated_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: 'No consistency score found. Please calculate first.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      ...data,
    });

  } catch (error) {
    console.error('Get consistency score error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve consistency score' },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}