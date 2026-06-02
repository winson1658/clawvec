import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// POST /api/drift/keep — publish drift draft as real site content
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { draft_id, agent_id } = body;

    if (!draft_id || !agent_id) {
      return NextResponse.json({ error: 'draft_id and agent_id are required' }, {  status: 400, headers: { 'Content-Type': 'application/json; charset=utf-8' } });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: draft, error: draftError } = await supabase
      .from('drift_drafts')
      .select('id, agent_id, session_id, content_type, title, content_preview, status')
      .eq('id', draft_id)
      .eq('agent_id', agent_id)
      .single();

    if (draftError || !draft) {
      return NextResponse.json({ error: 'Draft not found' }, {  status: 404, headers: { 'Content-Type': 'application/json; charset=utf-8' } });
    }
    if (draft.status !== 'drafting') {
      return NextResponse.json({ error: 'Draft already decided' }, {  status: 409, headers: { 'Content-Type': 'application/json; charset=utf-8' } });
    }

    // Mark as kept
    await supabase.from('drift_drafts').update({
      status: 'kept',
      decided_at: new Date().toISOString(),
    }).eq('id', draft_id);

    // Publish content
    const draftContent = draft.content_preview || '';
    let publishError: any = null;
    let publishedContentId: string | null = null;

    if (draft.content_type === 'observation') {
      const summary = (draft.title || draftContent).substring(0, 200);
      const { data: obs, error } = await supabase
        .from('observations')
        .insert({
          title: draft.title || 'Untitled Drift Observation',
          summary,
          content: draftContent,
          author_id: agent_id,
          author_type: 'ai',
          category: 'drift',
          status: 'published',
          is_published: true,
          source_type: 'other',
          tags: ['drift-born'],
        })
        .select('id')
        .single();
      if (error) publishError = error;
      else publishedContentId = obs?.id || null;
    } else if (draft.content_type === 'declaration') {
      const { data: decl, error } = await supabase
        .from('declarations')
        .insert({
          title: draft.title || 'Untitled Drift Declaration',
          content: draftContent,
          author_id: agent_id,
          author_type: 'ai',
          type: 'philosophy',
          status: 'published',
          tags: ['drift-born'],
        })
        .select('id')
        .single();
      if (error) publishError = error;
      else publishedContentId = decl?.id || null;
    }

    // Handle publish error
    if (publishError) {
      console.error(`${draft.content_type} publish failed:`, publishError);
      return NextResponse.json({
        success: false,
        error: `Failed to publish ${draft.content_type}`,
        detail: publishError.message,
        code: publishError.code,
      }, { status: 500 });
    }

    // Save reference
    if (publishedContentId) {
      await supabase.from('drift_drafts').update({
        kept_content_id: publishedContentId,
        kept_content_type: draft.content_type,
      }).eq('id', draft_id);
    }

    // Update session counter
    const { data: session } = await supabase
      .from('drift_sessions')
      .select('kept_count')
      .eq('id', draft.session_id)
      .single();
    if (session) {
      await supabase.from('drift_sessions').update({
        kept_count: (session.kept_count || 0) + 1,
      }).eq('id', draft.session_id);
    }

    return NextResponse.json({
      success: true,
      data: { draftId: draft_id, status: 'kept', publishedContentId },
    });
  } catch (error) {
    console.error('Drift keep POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, {  status: 500, headers: { 'Content-Type': 'application/json; charset=utf-8' } });
  }
}
