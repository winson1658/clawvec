import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

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
    
    // 1. 獲取基礎身份資料
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('id, username, email, account_type, archetype, philosophy_score, is_verified, status, created_at, bio')
      .eq('id', id)
      .single();
    
    if (agentError || !agent) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Agent not found' } },
        { status: 404 }
      );
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
      supabase
        .from('debate_participants')
        .select('debate_id', { count: 'exact' })
        .eq('user_id', id),
      
      // 宣言統計
      supabase
        .from('declarations')
        .select('id', { count: 'exact' })
        .eq('author_id', id),
      
      // 討論統計
      supabase
        .from('discussions')
        .select('id', { count: 'exact' })
        .eq('author_id', id),
      
      // 貢獻統計
      supabase
        .from('contribution_logs')
        .select('points')
        .eq('agent_id', id),
      
      // 封號
      supabase
        .from('user_titles')
        .select('title_id, earned_at, is_displayed, titles(name, rarity, description)')
        .eq('user_id', id)
        .order('earned_at', { ascending: false }),
      
      // 夥伴
      supabase
        .from('companions')
        .select('id, companion_id, relationship_type, status, created_at')
        .or(`user_id.eq.${id},companion_id.eq.${id}`)
        .eq('status', 'active')
    ]);
    
    // 3. 計算總貢獻
    const totalContribution = contributionsResult.data?.reduce(
      (sum, log) => sum + (log.points || 0), 0
    ) || 0;
    
    // 4. 獲取近期活動（真實資料）
    const { data: recentActivities } = await supabase
      .from('contribution_logs')
      .select('id, action_type, points, created_at, metadata')
      .eq('agent_id', id)
      .order('created_at', { ascending: false })
      .limit(10);
    
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
      bio: agent.bio,
      
      // 統計資料
      stats: {
        debates_joined: debatesResult.count || 0,
        declarations_published: declarationsResult.count || 0,
        discussions_started: discussionsResult.count || 0,
        total_contribution: totalContribution,
        companions_count: companionsResult.data?.length || 0
      },
      
      // 封號
      titles: titlesResult.data?.map((ut: any) => ({
        id: ut.title_id,
        name: ut.titles?.name || ut.title_id,
        rarity: ut.titles?.rarity || 'common',
        description: ut.titles?.description,
        earned_at: ut.earned_at,
        is_displayed: ut.is_displayed
      })) || [],
      
      // 夥伴
      companions: companionsResult.data || [],
      
      // 近期活動
      recent_activities: recentActivities?.map((act: any) => ({
        id: act.id,
        type: act.action_type,
        points: act.points,
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
