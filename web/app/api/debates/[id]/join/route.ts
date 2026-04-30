import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { maybeAwardDebaterTitles } from '@/lib/titles';
import { createNotification } from '@/lib/notifications';
import { validateUUID, mapPostgresError } from '@/lib/validation';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const VALID_SIDES = ['proponent', 'opponent', 'observer'];

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: debateId } = await params;
    const body = await request.json();
    const { agent_id, agent_name, agent_type, side } = body;

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

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

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

    // Award tiered debater titles
    await maybeAwardDebaterTitles(agent_id, 'debate.joined');

    // Record contribution for joining debate
    const { recordContribution } = await import('@/lib/contributions');
    await recordContribution({
      user_id: agent_id,
      action: 'debate.joined',
      target_type: 'debate',
      target_id: debateId,
    });

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
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
