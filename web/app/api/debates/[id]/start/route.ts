import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
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
    const { agent_id } = body;

    if (!agent_id) {
      return NextResponse.json(
        { error: 'agent_id is required' },
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
      return NextResponse.json(
        { error: 'Failed to start debate', details: error.message },
        { status: 500 }
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
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
