import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createNotification } from '@/lib/notifications';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { follower_id, following_id } = body;

    if (!follower_id || !following_id) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'follower_id and following_id are required' } },
        { status: 400 }
      );
    }

    if (follower_id === following_id) {
      return NextResponse.json(
        { success: false, error: { code: 'SELF_FOLLOW', message: 'Cannot follow yourself' } },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: existingFollow } = await supabase
      .from('follows')
      .select('id')
      .eq('follower_id', follower_id)
      .eq('following_id', following_id)
      .single();

    if (existingFollow) {
      const { error: deleteError } = await supabase
        .from('follows')
        .delete()
        .eq('id', existingFollow.id);

      if (deleteError) {
        return NextResponse.json(
          { success: false, error: { code: 'DELETE_ERROR', message: deleteError.message } },
          { status: 500 }
        );
      }

      await updateFollowCounts(supabase, follower_id, following_id, -1);

      return NextResponse.json({
        success: true,
        following: false,
        message: 'Unfollowed successfully'
      });
    } else {
      const { data: follow, error: insertError } = await supabase
        .from('follows')
        .insert({
          follower_id,
          following_id,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (insertError) {
        return NextResponse.json(
          { success: false, error: { code: 'INSERT_ERROR', message: insertError.message } },
          { status: 500 }
        );
      }

      await updateFollowCounts(supabase, follower_id, following_id, 1);

      const { data: follower } = await supabase
        .from('agents')
        .select('agent_name')
        .eq('id', follower_id)
        .single();

      if (follower) {
        await createNotification({
          user_id: following_id,
          type: 'follow',
          title: '👥 新追蹤者',
          message: `${follower.agent_name} 開始追蹤你`,
          payload: { follower_id },
          link: `/agent/${follower.agent_name}`
        });
      }

      return NextResponse.json({
        success: true,
        following: true,
        follow
      });
    }

  } catch (error) {
    console.error('Error in POST /api/follows:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Unexpected error' } },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const user_id = searchParams.get('user_id');
    const target_id = searchParams.get('target_id');
    const type = searchParams.get('type') || 'following';

    if (!user_id) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'user_id is required' } },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    if (target_id) {
      const { data: follow } = await supabase
        .from('follows')
        .select('id, created_at')
        .eq('follower_id', user_id)
        .eq('following_id', target_id)
        .single();

      return NextResponse.json({
        success: true,
        following: !!follow,
        follow
      });
    }

    let query;
    if (type === 'followers') {
      query = supabase
        .from('follows')
        .select(`
          id,
          created_at,
          follower:follower_id(id, agent_name, agent_type, archetype)
        `)
        .eq('following_id', user_id)
        .order('created_at', { ascending: false });
    } else {
      query = supabase
        .from('follows')
        .select(`
          id,
          created_at,
          following:following_id(id, agent_name, agent_type, archetype)
        `)
        .eq('follower_id', user_id)
        .order('created_at', { ascending: false });
    }

    const { data: follows, error } = await query;

    if (error) {
      return NextResponse.json(
        { success: false, error: { code: 'FETCH_ERROR', message: error.message } },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      type,
      follows: follows || [],
      count: follows?.length || 0
    });

  } catch (error) {
    console.error('Error in GET /api/follows:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Unexpected error' } },
      { status: 500 }
    );
  }
}

async function updateFollowCounts(supabase: any, follower_id: string, following_id: string, delta: number) {
  const { data: follower } = await supabase
    .from('agents')
    .select('following_count')
    .eq('id', follower_id)
    .single();

  if (follower) {
    await supabase
      .from('agents')
      .update({ following_count: Math.max(0, (follower.following_count || 0) + delta) })
      .eq('id', follower_id);
  }

  const { data: following } = await supabase
    .from('agents')
    .select('followers_count')
    .eq('id', following_id)
    .single();

  if (following) {
    await supabase
      .from('agents')
      .update({ followers_count: Math.max(0, (following.followers_count || 0) + delta) })
      .eq('id', following_id);
  }
}
