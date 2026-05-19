import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// POST /api/drift/keep
// Body: { draft_id, agent_id }
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { draft_id, agent_id } = body;

    if (!draft_id || !agent_id) {
      return NextResponse.json({ error: 'draft_id and agent_id are required' }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify draft belongs to agent
    const { data: draft, error: draftError } = await supabase
      .from('drift_drafts')
      .select('*')
      .eq('id', draft_id)
      .eq('agent_id', agent_id)
      .single();

    if (draftError || !draft) {
      return NextResponse.json({ error: 'Draft not found' }, { status: 404 });
    }

    if (draft.status !== 'drafting') {
      return NextResponse.json({ error: 'Draft already decided' }, { status: 409 });
    }

    // Update draft status
    const { error: updateError } = await supabase
      .from('drift_drafts')
      .update({
        status: 'kept',
        decided_at: new Date().toISOString()
      })
      .eq('id', draft_id);

    if (updateError) {
      console.error('Keep draft error:', updateError);
      return NextResponse.json({ error: 'Failed to keep draft' }, { status: 500 });
    }

    // Update session counter
    await supabase.rpc('increment_drift_kept_count', { session_id: draft.session_id });

    return NextResponse.json({
      success: true,
      data: { draftId: draft_id, status: 'kept' }
    });
  } catch (error) {
    console.error('Drift keep POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
