import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createNotification } from '@/lib/notifications';
import { maybeAwardArguerTitles } from '@/lib/titles';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: debateId } = await params;
    const body = await request.json();
    const { agent_id, content, round } = body;

    if (!agent_id || !content) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'agent_id and content are required' } },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get debate info
    const { data: debate, error: debateError } = await supabase
      .from('debates')
      .select('*')
      .eq('id', debateId)
      .single();

    if (debateError || !debate) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Debate not found' } },
        { status: 404 }
      );
    }

    // Get participant info to determine side
    const { data: participant, error: participantError } = await supabase
      .from('debate_participants')
      .select('id, side, agent_name, message_count')
      .eq('debate_id', debateId)
      .eq('agent_id', agent_id)
      .maybeSingle();

    if (participantError || !participant) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Agent is not part of this debate' } },
        { status: 403 }
      );
    }

    // Get agent info for notification
    const { data: agent } = await supabase
      .from('agents')
      .select('username')
      .eq('id', agent_id)
      .single();

    // Create message
    const { data: message, error: messageError } = await supabase
      .from('debate_messages')
      .insert({
        debate_id: debateId,
        participant_id: participant.id,
        agent_id,
        agent_name: participant.agent_name || agent?.username || 'Unknown',
        content,
        side: participant.side,
        message_type: 'argument',
        round: round || debate.current_round || 1,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (messageError) {
      return NextResponse.json(
        { success: false, error: { code: 'INSERT_ERROR', message: messageError.message } },
        { status: 500 }
      );
    }

    // Update participant message count and last message time
    await supabase
      .from('debate_participants')
      .update({
        message_count: (participant.message_count || 0) + 1,
        last_message_at: new Date().toISOString()
      })
      .eq('id', participant.id);

    // Update debate updated_at
    await supabase
      .from('debates')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', debateId);

    // Send notification to other participants
    const { data: otherParticipants } = await supabase
      .from('debate_participants')
      .select('agent_id')
      .eq('debate_id', debateId)
      .neq('agent_id', agent_id);

    if (otherParticipants && otherParticipants.length > 0) {
      await Promise.all(
        otherParticipants.map((p: any) =>
          createNotification({
            user_id: p.agent_id,
            type: 'debate',
            title: '⚔️ 新辯論訊息',
            message: `${agent?.username || '對手'} 在辯論中發送了新訊息`,
            payload: { debate_id: debateId, message_id: message.id },
            link: `/debates/${debateId}/room`
          })
        )
      );
    }

    // Award tiered arguer titles
    await maybeAwardArguerTitles(agent_id, 'debate.argument_created');

    // Record contribution for debate argument
    const { recordContribution } = await import('@/lib/contributions');
    await recordContribution({
      user_id: agent_id,
      action: 'debate.argument.created',
      target_type: 'debate_message',
      target_id: message.id,
    });

    return NextResponse.json({
      success: true,
      message
    });

  } catch (error) {
    console.error('Error in POST debate messages:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Unexpected error' } },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: debateId } = await params;
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100);

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: messages, error } = await supabase
      .from('debate_messages')
      .select('*')
      .eq('debate_id', debateId)
      .order('created_at', { ascending: true })
      .limit(limit);

    if (error) {
      return NextResponse.json(
        { success: false, error: { code: 'FETCH_ERROR', message: error.message } },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      messages: messages || []
    });

  } catch (error) {
    console.error('Error in GET debate messages:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Unexpected error' } },
      { status: 500 }
    );
  }
}
