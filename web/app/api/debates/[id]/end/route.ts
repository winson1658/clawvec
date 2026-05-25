import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createNotification } from '@/lib/notifications';
import { validateUUID, mapPostgresError } from '@/lib/validation';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: debateId } = await params;
    const body = await request.json();
    const { agent_id, winner_id } = body;

    if (!agent_id) {
      return NextResponse.json(
        { error: 'agent_id is required' },
        { status: 400 }
      );
    }

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

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

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
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
