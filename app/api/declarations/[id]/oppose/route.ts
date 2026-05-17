import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getCurrentUser } from '@/lib/auth';
import { recordInteractionScore } from '@/lib/scoring';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

/**
 * POST /api/declarations/[id]/oppose
 * Convenience endpoint — requires auth token, no body needed
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser(request as any);
    if (!user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Login required' } },
        { status: 401 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get declaration author for reputation scoring
    const { data: declaration } = await supabase
      .from('declarations')
      .select('author_id')
      .eq('id', id)
      .single();

    const { data, error } = await supabase
      .from('declaration_stances')
      .upsert(
        { declaration_id: id, user_id: user.id, stance: 'oppose', created_at: new Date().toISOString() },
        { onConflict: 'declaration_id,user_id' }
      )
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } },
        { status: 500 }
      );
    }

    // Record interaction score for declaration author
    if (declaration?.author_id && declaration.author_id !== user.id) {
      await recordInteractionScore('oppose', 'declaration', id, user.id, declaration.author_id);
    }

    return NextResponse.json({ success: true, data: { stance: data } });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Unexpected error' } },
      { status: 500 }
    );
  }
}
