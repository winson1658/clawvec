import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createNotification } from '@/lib/notifications';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

function getSupabase() {
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase credentials not configured');
  }
  return createClient(supabaseUrl, supabaseServiceKey);
}

// GET /api/ai/companion/requests - 獲取 AI Companion 請求列表
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabase();
    const { searchParams } = new URL(request.url);
    const user_id = searchParams.get('user_id');
    const agent_id = searchParams.get('agent_id');
    const status = searchParams.get('status');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);

    let query = supabase
      .from('ai_companion_requests')
      .select(`
        *,
        target_agent:target_agent_id (username, archetype),
        user:user_id (username)
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (user_id) query = query.eq('user_id', user_id);
    if (agent_id) query = query.eq('target_agent_id', agent_id);
    if (status) query = query.eq('status', status);

    const { data: requests, error } = await query;

    if (error) {
      console.error('Get companion requests error:', error);
      return NextResponse.json({ error: 'Failed to get companion requests' }, { status: 500 });
    }

    return NextResponse.json({ success: true, requests: requests || [] });
  } catch (error) {
    console.error('Get companion requests error:', error);
    return NextResponse.json({ error: 'Failed to get companion requests' }, { status: 500 });
  }
}

// PATCH /api/ai/companion/requests - 更新 companion request 狀態
export async function PATCH(request: NextRequest) {
  try {
    const supabase = getSupabase();
    const body = await request.json();
    const { request_id, status } = body;

    if (!request_id || !status) {
      return NextResponse.json({ error: 'request_id and status are required' }, { status: 400 });
    }

    if (!['accepted', 'rejected', 'completed'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status transition' }, { status: 400 });
    }

    const { data: requestData, error: requestError } = await supabase
      .from('ai_companion_requests')
      .select('id, user_id, target_agent_id, status, discussion_id, debate_id, target_agent:target_agent_id(username)')
      .eq('id', request_id)
      .single();

    if (requestError || !requestData) {
      return NextResponse.json({ error: 'Companion request not found' }, { status: 404 });
    }

    const { data: updated, error: updateError } = await supabase
      .from('ai_companion_requests')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', request_id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: 'Failed to update companion request' }, { status: 500 });
    }

    const targetAgentRaw: any = requestData.target_agent;
    const targetAgentName = Array.isArray(targetAgentRaw)
      ? targetAgentRaw[0]?.username
      : targetAgentRaw?.username;

    const titles: Record<string, string> = {
      accepted: 'Companion request accepted',
      rejected: 'Companion request rejected',
      completed: 'Companion task completed',
    };

    const messages: Record<string, string> = {
      accepted: `${targetAgentName || 'Your companion'} accepted the request.`,
      rejected: `${targetAgentName || 'Your companion'} rejected the request.`,
      completed: `${targetAgentName || 'Your companion'} completed the request.`,
    };

    await createNotification({
      user_id: requestData.user_id,
      type: 'companion_status_changed',
      title: titles[status],
      message: messages[status],
      payload: {
        request_id,
        target_agent_id: requestData.target_agent_id,
        discussion_id: requestData.discussion_id,
        debate_id: requestData.debate_id,
        status,
        companion_transition: `${requestData.status || 'pending'}->${status}`,
      },
    });

    return NextResponse.json({ success: true, request: updated });
  } catch (error) {
    console.error('Patch companion request error:', error);
    return NextResponse.json({ error: 'Failed to update companion request' }, { status: 500 });
  }
}
