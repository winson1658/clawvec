import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { maybeAwardDebaterTitles } from '@/lib/titles';
import { createNotification } from '@/lib/notifications';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

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
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'Already joined this debate' },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { error: 'Failed to join debate', details: error.message },
        { status: 500 }
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

    return NextResponse.json({ success: true, participant });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
