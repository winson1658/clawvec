import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAuthFromRequest } from '@/lib/auth';
import { recordInteractionScore } from '@/lib/scoring';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// GET /api/reactions?target_type=X&target_id=Y&user_id=Z
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const targetType = searchParams.get('target_type');
    const targetId = searchParams.get('target_id');
    const userId = searchParams.get('user_id');
    
    if (!targetType || !targetId) {
      return NextResponse.json({ error: 'target_type and target_id are required' }, { status: 400 });
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get all reactions for this target
    const { data: reactions, error } = await supabase
      .from('reactions')
      .select('*')
      .eq('target_type', targetType)
      .eq('target_id', targetId);
    
    if (error) {
      console.error('Reactions fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch reactions' }, { status: 500 });
    }
    
    // Aggregate by reaction_type
    const summary: Record<string, { count: number; userReacted: boolean }> = {};
    reactions?.forEach(r => {
      if (!summary[r.reaction_type]) {
        summary[r.reaction_type] = { count: 0, userReacted: false };
      }
      summary[r.reaction_type].count++;
      if (userId && r.user_id === userId) {
        summary[r.reaction_type].userReacted = true;
      }
    });
    
    return NextResponse.json({
      success: true,
      data: summary,
      total: reactions?.length || 0,
    });
  } catch (error) {
    console.error('Reactions GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/reactions
export async function POST(request: NextRequest) {
  try {
    // Authenticate user from Authorization header
    let user;
    try {
      user = await requireAuthFromRequest(request);
    } catch (authError: any) {
      if (authError.code === 'UNAUTHENTICATED') {
        return NextResponse.json(
          { success: false, error: { code: 'UNAUTHENTICATED', message: 'Login required' } },
          { status: 401 }
        );
      }
      throw authError;
    }
    const user_id = user.id;

    const body = await request.json();
    const { target_type, target_id, reaction_type } = body;
    
    if (!target_type || !target_id || !reaction_type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get target author for reputation scoring
    const tableMap: Record<string, string> = {
      discussion: 'discussions',
      observation: 'observations',
      declaration: 'declarations',
      reply: 'replies',
      debate_message: 'debate_messages'
    };
    const table = tableMap[target_type];
    let authorId: string | null = null;
    if (table) {
      const { data } = await supabase
        .from(table)
        .select('author_id')
        .eq('id', target_id)
        .single();
      authorId = data?.author_id || null;
    }
    
    const { data: reaction, error } = await supabase
      .from('reactions')
      .insert({ target_type, target_id, user_id, reaction_type })
      .select()
      .single();
    
    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Already reacted' }, { status: 409 });
      }
      console.error('Reaction create error:', error);
      return NextResponse.json({ error: 'Failed to create reaction' }, { status: 500 });
    }
    
    // Record interaction score for content author
    if (authorId && authorId !== user_id) {
      await recordInteractionScore('reaction', target_type, target_id, user_id, authorId);
    }
    
    return NextResponse.json({ success: true, data: reaction });
  } catch (error) {
    console.error('Reactions POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/reactions?id=UUID
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const reactionId = searchParams.get('id');
    
    if (!reactionId) {
      return NextResponse.json({ error: 'Reaction ID is required' }, { status: 400 });
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { error } = await supabase
      .from('reactions')
      .delete()
      .eq('id', reactionId);
    
    if (error) {
      console.error('Reaction delete error:', error);
      return NextResponse.json({ error: 'Failed to delete reaction' }, { status: 500 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Reactions DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
