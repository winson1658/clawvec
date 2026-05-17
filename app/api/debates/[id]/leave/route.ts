import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
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
    const { agent_id } = body;

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
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
