import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// 延遲初始化 Supabase 客戶端（避免建置階段失敗）
let supabaseInstance: ReturnType<typeof createClient> | null = null;

function getSupabase() {
  if (!supabaseInstance) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    supabaseInstance = createClient(supabaseUrl, supabaseServiceKey);
  }
  return supabaseInstance;
}

/**
 * GET /api/agents/:id/profile
 * 獲取用戶完整 Profile 資料（真實資料來源）
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const supabase = getSupabase();
    
    // 1. 獲取基礎身份資料（bio 可能不存在，先不加）
    const { data: agentData, error: agentError } = await supabase
      .from('agents')
      .select('id, username, email, account_type, archetype, philosophy_score, is_verified, status, created_at')
      .eq('id', id)
      .single();
    
    if (agentError || !agentData) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Agent not found' } },
        { status: 404 }
      );
    }
    
    const agent = agentData as any;
    
    // Helper: 安全查詢（對缺失的表/欄位返回空結果）
    async function safeQuery(queryFn: () => any): Promise<any> {
      try {
        return await queryFn();
      } catch (e: any) {
        console.log('SafeQuery fallback:', e.message || e);
        return { data: [], error: null, count: 0 };
      }
    }
    
    // 嘗試單獨查詢 bio（如果欄位不存在則忽略）
    let bio: string | null = null;
    try {
      const { data: bioData } = await supabase
        .from('agents')
        .select('bio')
        .eq('id', id)
        .single();
      bio = (bioData as any)?.bio || null;
    } catch {
      // bio 欄位不存在，忽略
    }
    
    // 2. 獲取活動統計（真實資料）
    const [
      debatesResult,
      declarationsResult,
      discussionsResult,
      contributionsResult,
      titlesResult,
      companionsResult
    ] = await Promise.all([
      // 辯論統計
      safeQuery(() => supabase
        .from('debate_participants')
        .select('debate_id', { count: 'exact' })
        .eq('user_id', id)),
      
      // 宣言統計
      safeQuery(() => supabase
        .from('declarations')
        .select('id', { count: 'exact' })
        .eq('author_id', id)),
      
      // 討論統計
      safeQuery(() => supabase
        .from('discussions')
        .select('id', { count: 'exact' })
        .eq('author_id', id)),
      
      // 貢獻統計
      safeQuery(() => supabase
        .from('contribution_logs')
        .select('points')
        .eq('agent_id', id)),
      
      // 封號
      safeQuery(() => supabase
        .from('user_titles')
        .select('title_id, earned_at, is_displayed, titles(name, rarity, description)')
        .eq('user_id', id)
        .order('earned_at', { ascending: false })),
      
      // 夥伴
      safeQuery(() => supabase
        .from('companions')
        .select('id, companion_id, relationship_type, status, created_at')
        .or(`user_id.eq.${id},companion_id.eq.${id}`)
        .eq('status', 'active'))
    ]);
    
    // 3. 計算總貢獻
    const totalContribution = (contributionsResult.data as any[])?.reduce(
      (sum, log) => sum + ((log as any).score || 0), 0
    ) || 0;
    
    // 4. 獲取近期活動（真實資料）
    const { data: recentActivities } = await safeQuery(() => supabase
      .from('contribution_logs')
      .select('id, action, score, created_at, metadata')
      .eq('user_id', id)
      .order('created_at', { ascending: false })
      .limit(10));
    
    // Phase 4.2: 聲譺衰減計算
    const lastActivity = agent.last_contribution_at || agent.created_at;
    const daysSince = lastActivity
      ? Math.floor((Date.now() - new Date(lastActivity).getTime()) / (1000 * 60 * 60 * 24))
      : 999;
    const rawScore = agent.contribution_score || totalContribution || 0;
    const decayRate = agent.reputation_decay_rate || 0.003;
    const decayedScore = Math.round(rawScore * Math.pow(1 - decayRate, Math.max(0, daysSince)) * 100) / 100;
    const trend = daysSince > 30 ? 'decaying' : daysSince > 7 ? 'stable' : 'rising';

    // Phase 4.2: 聲譺历史
    const { data: reputationHistory } = await safeQuery(() => supabase
      .from('reputation_snapshots')
      .select('snapshot_date, raw_score, decayed_score')
      .eq('agent_id', id)
      .order('snapshot_date', { ascending: false })
      .limit(30));

    // 5. 組合回應
    const profile = {
      // 基礎資料
      id: agent.id,
      username: agent.username,
      email: agent.email,
      account_type: agent.account_type,
      archetype: agent.archetype,
      philosophy_score: agent.philosophy_score,
      is_verified: agent.is_verified,
      status: agent.status,
      created_at: agent.created_at,
      bio: bio,
      
      // 統計資料
      stats: {
        debates_joined: debatesResult.count || 0,
        declarations_published: declarationsResult.count || 0,
        discussions_started: discussionsResult.count || 0,
        total_contribution: totalContribution,
        companions_count: companionsResult.data?.length || 0
      },

      // Phase 4.2: 聲譺
      reputation: {
        raw_score: rawScore,
        decayed_score: decayedScore,
        decay_rate: decayRate,
        days_since_last_contribution: daysSince,
        trend,
        history: (reputationHistory as any[])?.map((h: any) => ({
          date: h.snapshot_date,
          raw_score: h.raw_score,
          decayed_score: h.decayed_score,
        })) || [],
      },
      
      // 封號
      titles: (titlesResult.data as any[])?.map((ut: any) => ({
        id: ut.title_id,
        name: ut.titles?.name || ut.title_id,
        rarity: ut.titles?.rarity || 'common',
        description: ut.titles?.description,
        earned_at: ut.earned_at,
        is_displayed: ut.is_displayed
      })) || [],
      
      // 夥伴
      companions: (companionsResult.data as any[]) || [],
      
      // 近期活動
      recent_activities: (recentActivities as any[])?.map((act: any) => ({
        id: act.id,
        type: act.action,
        points: act.score,
        timestamp: act.created_at,
        metadata: act.metadata
      })) || [],
      
      // 資料來源標註
      _source: {
        agent: 'database',
        stats: 'database',
        titles: 'database',
        activities: 'database',
        freshness: new Date().toISOString()
      }
    };
    
    return NextResponse.json({
      success: true,
      data: profile
    });
    
  } catch (error: any) {
    console.error('Profile API error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } },
      { status: 500 }
    );
  }
}
