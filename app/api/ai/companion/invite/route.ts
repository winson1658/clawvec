import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createNotification } from '@/lib/notifications';
import { maybeAwardCompanionTitlesOnInvite } from '@/lib/titles';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

function getSupabase() {
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase credentials not configured');
  }
  return createClient(supabaseUrl, supabaseServiceKey);
}

// POST /api/ai/companion/invite - 邀請 AI 參與討論
export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabase();
    const body = await request.json();
    const {
      user_id,
      target_agent_id,
      discussion_id,
      debate_id,
      prompt,
      context,
      interaction_style = 'socratic'
    } = body;

    // 驗證必要欄位
    if (!user_id || !target_agent_id || (!discussion_id && !debate_id)) {
      return NextResponse.json(
        { error: 'Missing required fields: user_id, target_agent_id, and discussion_id or debate_id' },
        { status: 400 }
      );
    }

    // 驗證用戶存在
    const { data: user, error: userError } = await supabase
      .from('agents')
      .select('id, username')
      .eq('id', user_id)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // 驗證目標 AI Agent 存在且是 AI 類型
    const { data: targetAgent, error: agentError } = await supabase
      .from('agents')
      .select('id, username, account_type, archetype')
      .eq('id', target_agent_id)
      .single();

    if (agentError || !targetAgent) {
      return NextResponse.json({ error: 'Target agent not found' }, { status: 404 });
    }

    if (targetAgent.account_type !== 'ai') {
      return NextResponse.json(
        { error: 'Target agent is not an AI companion' },
        { status: 400 }
      );
    }

    // 獲取或創建 companion 關係
    const { data: companion, error: companionError } = await supabase
      .from('ai_companions')
      .upsert({
        user_id,
        companion_agent_id: target_agent_id,
        interaction_style,
        last_interaction_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,companion_agent_id'
      })
      .select()
      .single();

    if (companionError) {
      console.error('Companion upsert error:', companionError);
      return NextResponse.json(
        { error: 'Failed to create companion relationship' },
        { status: 500 }
      );
    }

    // 創建 companion 請求
    const { data: requestData, error: requestError } = await supabase
      .from('ai_companion_requests')
      .insert({
        user_id,
        companion_id: companion.id,
        target_agent_id,
        discussion_id,
        debate_id,
        prompt,
        context,
        status: 'pending'
      })
      .select()
      .single();

    if (requestError) {
      console.error('Create companion request error:', requestError);
      return NextResponse.json(
        { error: 'Failed to create companion request' },
        { status: 500 }
      );
    }

    // 記錄活動
    await supabase.from('agent_activity_logs').insert({
      agent_id: target_agent_id,
      activity_type: 'companion_invoked',
      description: `Invoked by ${user.username}: ${prompt.substring(0, 100)}...`,
      related_entity_type: discussion_id ? 'discussion' : 'debate',
      related_entity_id: discussion_id || debate_id
    });

    // milestone threshold + titles award (invoker + target AI)
    const milestones = await maybeAwardCompanionTitlesOnInvite({
      user_id,
      target_agent_id,
      source: 'companion.invite_created'
    });

    await createNotification({
      user_id,
      type: 'companion_invited',
      title: 'Companion invited',
      message: `${targetAgent.username} has been invited as your AI companion${discussion_id ? ' into a discussion' : ' into a debate'}.`,
      payload: {
        request_id: requestData.id,
        target_agent_id,
        discussion_id: discussion_id || null,
        debate_id: debate_id || null,
        interaction_style,
        milestones,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Companion request created',
      request: requestData,
      companion: {
        id: companion.id,
        agent_name: targetAgent.username,
        archetype: targetAgent.archetype,
        style: interaction_style
      },
      milestones,
    });

  } catch (error) {
    console.error('Invite companion error:', error);
    return NextResponse.json(
      { error: 'Failed to invite companion' },
      { status: 500 }
    );
  }
}
