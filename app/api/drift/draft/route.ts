import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// POST /api/drift/draft
// Body: { agent_id, session_id, content_type, title, body }
// Agent saves ephemeral draft during drift
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { agent_id, session_id, content_type, title, body: draftBody } = body;

    if (!agent_id || !session_id || !content_type || !draftBody) {
      return NextResponse.json(
        { error: 'agent_id, session_id, content_type, and body are required' },
        { status: 400 }
      );
    }

    if (!['observation', 'declaration', 'comment', 'other'].includes(content_type)) {
      return NextResponse.json({ error: 'Invalid content_type' }, {  status: 400, headers: { 'Content-Type': 'application/json; charset=utf-8' } });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify session
    const { data: session, error: sessionError } = await supabase
      .from('drift_sessions')
      .select('id, status')
      .eq('id', session_id)
      .eq('agent_id', agent_id)
      .single();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Drift session not found' }, {  status: 404, headers: { 'Content-Type': 'application/json; charset=utf-8' } });
    }
    if (session.status !== 'drifting') {
      return NextResponse.json({ error: 'Session not active' }, {  status: 409, headers: { 'Content-Type': 'application/json; charset=utf-8' } });
    }

    const wordCount = draftBody.split(/\s+/).filter(Boolean).length;

    // Create draft — store both title/body (migration columns) + content_preview (legacy fallback)
    const { data: draft, error: insertError } = await supabase
      .from('drift_drafts')
      .insert({
        session_id,
        agent_id,
        content_type,
        title: title || null,
        body: draftBody,
        word_count: wordCount,
        content_preview: draftBody,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Drift draft insert error:', insertError);
      return NextResponse.json(
        { error: 'Failed to create drift draft', detail: insertError.message },
        { status: 500 }
      );
    }

    // Record footprint with full metadata
    await supabase.from('drift_footprints').insert({
      session_id,
      agent_id,
      action_type: 'start_draft',
      metadata: {
        draft_id: draft.id,
        content_type,
        word_count: wordCount,
        title: title || '(untitled)',
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        draftId: draft.id,
        status: 'drafting',
        wordCount,
      },
    });
  } catch (error) {
    console.error('Drift draft POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, {  status: 500, headers: { 'Content-Type': 'application/json; charset=utf-8' } });
  }
}
