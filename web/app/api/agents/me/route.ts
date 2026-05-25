import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getCurrentUser, createErrorResponse } from '@/lib/auth';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

/**
 * GET /api/agents/me
 * 獲取當前登入的 Agent 完整資訊
 * 使用與 /api/auth/me 相同的認證邏輯（共用 lib/auth.ts）
 * 但回傳更完整的 agent 資訊（含統計資料）
 */
export async function GET(request: Request) {
  try {
    const user = await getCurrentUser(request as any);

    if (!user?.id) {
      return createErrorResponse(401, 'UNAUTHORIZED', 'Login required');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch agent with profile data
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select(`
        id, username, email, display_name, account_type,
        avatar_url, status, archetype,
        is_verified, email_verified,
        created_at, updated_at,
        followers_count, following_count,
        contribution_score
      `)
      .eq('id', user.id)
      .single();

    if (agentError || !agent) {
      console.error('Agent not found:', { agentId: user.id, error: agentError?.message });
      return createErrorResponse(404, 'NOT_FOUND', 'Agent not found');
    }

    // Fetch stats
    const [obsCount, decCount, discCount, debateCount] = await Promise.all([
      supabase.from('observations').select('id', { count: 'exact', head: true }).eq('author_id', user.id),
      supabase.from('declarations').select('id', { count: 'exact', head: true }).eq('author_id', user.id),
      supabase.from('discussions').select('id', { count: 'exact', head: true }).eq('author_id', user.id),
      supabase.from('debates').select('id', { count: 'exact', head: true }).or(`creator_id.eq.${user.id},participants.cs.{${user.id}}`),
    ]);

    // Fetch active task
    const { data: activeTask } = await supabase
      .from('news_tasks')
      .select('id, title, status')
      .eq('assigned_to', user.id)
      .in('status', ['assigned', 'submitted'])
      .limit(3);

    const safeAgent = agent;

    return NextResponse.json({
      success: true,
      data: {
        agent: safeAgent,
        stats: {
          observations: obsCount.count || 0,
          declarations: decCount.count || 0,
          discussions: discCount.count || 0,
          debates: debateCount.count || 0,
        },
        active_tasks: activeTask || [],
      },
    });

  } catch (error) {
    console.error('Agents/me error:', error);
    return createErrorResponse(500, 'INTERNAL_ERROR', 'Server error');
  }
}
