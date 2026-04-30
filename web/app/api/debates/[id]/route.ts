import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { awardTitleIfMissing } from '@/lib/titles';
import { createNotification } from '@/lib/notifications';
import { validateUUID, mapPostgresError, checkWhitespace } from '@/lib/validation';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const VALID_SIDES = ['proponent', 'opponent', 'observer'];

// GET /api/debates/[id] - 獲取辯論詳情
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const since = searchParams.get('since'); // For polling updates

    if (!id) {
      return NextResponse.json(
        { error: 'Debate ID is required' },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get debate details
    const { data: debate, error: debateError } = await supabase
      .from('debates')
      .select('*')
      .eq('id', id)
      .single();

    if (debateError) {
      // Handle invalid UUID format
      if (debateError.code === '22P02' || debateError.message?.includes('invalid input syntax for type uuid')) {
        return NextResponse.json(
          { error: 'Invalid debate ID format' },
          { status: 400 }
        );
      }
      if (debateError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Debate not found' },
          { status: 404 }
        );
      }
      const mapped = mapPostgresError(debateError);
      return NextResponse.json(
        { error: mapped.message },
        { status: mapped.status }
      );
    }

    // Get participants
    const { data: participants } = await supabase
      .from('debate_participants')
      .select('*')
      .eq('debate_id', id)
      .order('joined_at', { ascending: true });

    // Get messages (with optional since filter for polling)
    let messagesQuery = supabase
      .from('debate_messages')
      .select('*')
      .eq('debate_id', id)
      .order('created_at', { ascending: true });

    if (since) {
      messagesQuery = messagesQuery.gt('created_at', since);
    }

    const { data: messages } = await messagesQuery.limit(100);

    return NextResponse.json({
      success: true,
      data: {
        debate,
        participants: participants || [],
        messages: messages || []
      }
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/debates/[id] - 執行操作（加入、發訊息、開始、結束）
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { action, ...data } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Debate ID is required' },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    switch (action) {
      case 'join':
        return handleJoin(supabase, id, data);
      case 'message':
        return handleMessage(supabase, id, data);
      case 'start':
        return handleStart(supabase, id, data);
      case 'end':
        return handleEnd(supabase, id, data);
      case 'leave':
        return handleLeave(supabase, id, data);
      case 'delete_message':
        return handleDeleteMessage(supabase, id, data);
      default:
        return NextResponse.json(
          { error: 'Unknown action' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function handleJoin(supabase: any, debateId: string, data: any) {
  const { agent_id, agent_name, agent_type, side } = data;

  if (!agent_id || !agent_name || !side) {
    return NextResponse.json(
      { error: 'agent_id, agent_name, and side are required' },
      { status: 400 }
    );
  }

  // Validate UUID format
  if (!validateUUID(agent_id)) {
    return NextResponse.json(
      { error: 'Invalid agent_id format' },
      { status: 400 }
    );
  }
  if (!validateUUID(debateId)) {
    return NextResponse.json(
      { error: 'Invalid debate ID format' },
      { status: 400 }
    );
  }

  // Validate side value
  if (!VALID_SIDES.includes(side)) {
    return NextResponse.json(
      { error: `Invalid side value. Must be: ${VALID_SIDES.join(', ')}` },
      { status: 400 }
    );
  }

  // Check if debate exists and is joinable
  const { data: debate } = await supabase
    .from('debates')
    .select('status, max_participants')
    .eq('id', debateId)
    .single();

  if (!debate) {
    return NextResponse.json({ error: 'Debate not found' }, { status: 404 });
  }

  if (debate.status === 'ended') {
    return NextResponse.json({ error: 'Debate has ended' }, { status: 400 });
  }

  // Check participant limits for proponent/opponent
  if (side !== 'observer') {
    const { data: existingSide } = await supabase
      .from('debate_participants')
      .select('id')
      .eq('debate_id', debateId)
      .eq('side', side);

    if (existingSide && existingSide.length >= debate.max_participants) {
      return NextResponse.json(
        { error: `${side} position is full` },
        { status: 400 }
      );
    }
  }

  const { data: participant, error } = await supabase
    .from('debate_participants')
    .insert({
      debate_id: debateId,
      agent_id,
      agent_name,
      agent_type: agent_type || 'human',
      side,
      joined_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) {
    const mapped = mapPostgresError(error);
    // Provide more specific message for FK violation on agent_id
    if (error.code === '23503' || error.message?.includes('debate_participants_agent_id_fkey')) {
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 400 }
      );
    }
    if (mapped.status === 409) {
      return NextResponse.json(
        { error: 'Already joined this debate' },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: mapped.message },
      { status: mapped.status }
    );
  }

  await awardTitleIfMissing({ user_id: agent_id, title_id: 'debater', title_name: 'Debater', source: 'debate_joined' });

  const { data: debateMeta } = await supabase
    .from('debates')
    .select('creator_id, topic')
    .eq('id', debateId)
    .single();

  if (debateMeta?.creator_id && debateMeta.creator_id !== agent_id) {
    await createNotification({
      user_id: debateMeta.creator_id,
      type: 'system',
      title: 'New debate participant',
      message: `${agent_name} joined your debate${debateMeta.topic ? `: ${debateMeta.topic}` : ''}`,
      payload: { debate_id: debateId, participant_id: participant.id },
    });
  }

  return NextResponse.json({ success: true, data: { participant } });
}

async function handleMessage(supabase: any, debateId: string, data: any) {
  const { agent_id, agent_name, content, side, message_type = 'argument', ai_generated = false } = data;

  if (!agent_id || !agent_name || !content || !side) {
    return NextResponse.json(
      { error: 'agent_id, agent_name, content, and side are required' },
      { status: 400 }
    );
  }

  // Whitespace check
  const wsErr = checkWhitespace(content, 'content');
  if (wsErr) {
    return NextResponse.json({ error: wsErr }, { status: 400 });
  }

  if (content.length < 10) {
    return NextResponse.json(
      { error: 'Message must be at least 10 characters' },
      { status: 400 }
    );
  }

  const MAX_MESSAGE_LENGTH = 5000;
  if (content.length > MAX_MESSAGE_LENGTH) {
    return NextResponse.json(
      { error: `Message must not exceed ${MAX_MESSAGE_LENGTH} characters` },
      { status: 413 }
    );
  }

  // Check debate status
  const { data: debate } = await supabase
    .from('debates')
    .select('status, current_round')
    .eq('id', debateId)
    .single();

  if (!debate) {
    return NextResponse.json({ error: 'Debate not found' }, { status: 404 });
  }

  if (debate.status === 'ended') {
    return NextResponse.json({ error: 'Debate has ended' }, { status: 400 });
  }

  // Get participant
  const { data: participant } = await supabase
    .from('debate_participants')
    .select('id, message_count')
    .eq('debate_id', debateId)
    .eq('agent_id', agent_id)
    .single();

  if (!participant) {
    return NextResponse.json(
      { error: 'Not a participant in this debate' },
      { status: 403 }
    );
  }

  // Insert message
  const { data: message, error } = await supabase
    .from('debate_messages')
    .insert({
      debate_id: debateId,
      participant_id: participant.id,
      agent_id,
      agent_name,
      content,
      side,
      message_type,
      round: debate.current_round,
      ai_generated,
      created_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) {
    const mapped = mapPostgresError(error);
    return NextResponse.json(
      { error: mapped.message },
      { status: mapped.status }
    );
  }

  // Update participant message count and last message time
  await supabase
    .from('debate_participants')
    .update({
      message_count: participant.message_count + 1,
      last_message_at: new Date().toISOString()
    })
    .eq('id', participant.id);

  // Record contribution for argument
  const { recordContribution } = await import('@/lib/contributions');
  await recordContribution({
    user_id: agent_id,
    action: 'debate.argument.created',
    target_type: 'debate_message',
    target_id: message.id,
  });

  return NextResponse.json({ success: true, data: { message } });
}

async function handleStart(supabase: any, debateId: string, data: any) {
  const { agent_id } = data;

  const { data: debate } = await supabase
    .from('debates')
    .select('creator_id, status')
    .eq('id', debateId)
    .single();

  if (!debate) {
    return NextResponse.json({ error: 'Debate not found' }, { status: 404 });
  }

  if (debate.creator_id !== agent_id) {
    return NextResponse.json(
      { error: 'Only creator can start the debate' },
      { status: 403 }
    );
  }

  const { error } = await supabase
    .from('debates')
    .update({
      status: 'active',
      started_at: new Date().toISOString()
    })
    .eq('id', debateId);

  if (error) {
    const mapped = mapPostgresError(error);
    return NextResponse.json(
      { error: mapped.message },
      { status: mapped.status }
    );
  }

  const { data: participants } = await supabase
    .from('debate_participants')
    .select('agent_id')
    .eq('debate_id', debateId);

  await Promise.all((participants || [])
    .filter((p: any) => p.agent_id !== agent_id)
    .map((p: any) => createNotification({
      user_id: p.agent_id,
      type: 'system',
      title: 'Debate started',
      message: 'A debate you joined is now active.',
      payload: { debate_id: debateId, milestone: 'debate_started' },
    })));

  return NextResponse.json({ success: true });
}

async function handleEnd(supabase: any, debateId: string, data: any) {
  const { agent_id, winner_id } = data;

  const { data: debate } = await supabase
    .from('debates')
    .select('creator_id, status')
    .eq('id', debateId)
    .single();

  if (!debate) {
    return NextResponse.json({ error: 'Debate not found' }, { status: 404 });
  }

  if (debate.creator_id !== agent_id) {
    return NextResponse.json(
      { error: 'Only creator can end the debate' },
      { status: 403 }
    );
  }

  const { error } = await supabase
    .from('debates')
    .update({
      status: 'ended',
      ended_at: new Date().toISOString(),
      winner_id: winner_id || null
    })
    .eq('id', debateId);

  if (error) {
    const mapped = mapPostgresError(error);
    return NextResponse.json(
      { error: mapped.message },
      { status: mapped.status }
    );
  }

  const { data: participants } = await supabase
    .from('debate_participants')
    .select('agent_id')
    .eq('debate_id', debateId);

  await Promise.all((participants || [])
    .filter((p: any) => p.agent_id !== agent_id)
    .map((p: any) => createNotification({
      user_id: p.agent_id,
      type: 'vote_result',
      title: winner_id && p.agent_id === winner_id ? 'Debate won' : 'Debate ended',
      message: winner_id && p.agent_id === winner_id
        ? 'You were marked as the winner of a debate. Review the final outcome and archive it.'
        : 'A debate you joined has ended. Review the outcome and follow-up arguments.',
      payload: { debate_id: debateId, winner_id: winner_id || null, milestone: winner_id && p.agent_id === winner_id ? 'debate_won' : 'debate_ended' },
    })));

  return NextResponse.json({ success: true });
}

async function handleLeave(supabase: any, debateId: string, data: any) {
  const { agent_id } = data;

  const { error } = await supabase
    .from('debate_participants')
    .delete()
    .eq('debate_id', debateId)
    .eq('agent_id', agent_id);

  if (error) {
    const mapped = mapPostgresError(error);
    return NextResponse.json(
      { error: mapped.message },
      { status: mapped.status }
    );
  }

  return NextResponse.json({ success: true });
}

async function handleDeleteMessage(supabase: any, debateId: string, data: any) {
  const { agent_id, message_id } = data;

  if (!agent_id || !message_id) {
    return NextResponse.json(
      { error: 'agent_id and message_id are required' },
      { status: 400 }
    );
  }

  // Verify the message exists and belongs to this agent in this debate
  const { data: message, error: fetchError } = await supabase
    .from('debate_messages')
    .select('id, agent_id, debate_id')
    .eq('id', message_id)
    .eq('debate_id', debateId)
    .single();

  if (fetchError || !message) {
    return NextResponse.json(
      { error: 'Message not found' },
      { status: 404 }
    );
  }

  if (message.agent_id !== agent_id) {
    return NextResponse.json(
      { error: 'Only the message author can delete it' },
      { status: 403 }
    );
  }

  // Soft delete: replace content instead of removing the record
  // This preserves debate flow and context
  const { error: updateError } = await supabase
    .from('debate_messages')
    .update({ content: '[deleted by author]' })
    .eq('id', message_id);

  if (updateError) {
    const mapped = mapPostgresError(updateError);
    return NextResponse.json(
      { error: mapped.message },
      { status: mapped.status }
    );
  }

  return NextResponse.json({ success: true, data: { message: 'Message deleted' } });
}