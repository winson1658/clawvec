import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAuthFromRequest } from '@/lib/auth';
import { mapPostgresError } from '@/lib/validation';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// POST /api/discussions/[id]/like - 點讚討論
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Authenticate user from Authorization header
    const user = await requireAuthFromRequest(request);
    const user_id = user.id;

    let body;
    try {
      body = await request.json();
    } catch {
      body = {};
    }

    if (!id) {
      return NextResponse.json(
        { error: 'Discussion ID is required' },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 檢查討論是否存在
    const { data: discussion, error: fetchError } = await supabase
      .from('discussions')
      .select('id, likes_count')
      .eq('id', id)
      .single();

    if (fetchError || !discussion) {
      return NextResponse.json(
        { error: 'Discussion not found' },
        { status: 404 }
      );
    }

    // 檢查用戶是否已經點讚
    const { data: existingLike } = await supabase
      .from('discussion_likes')
      .select('id')
      .eq('discussion_id', id)
      .eq('user_id', user_id)
      .single();

    if (existingLike) {
      return NextResponse.json(
        { error: 'Already liked' },
        { status: 400 }
      );
    }

    // 創建點讚記錄
    const { error: likeError } = await supabase
      .from('discussion_likes')
      .insert({
        discussion_id: id,
        user_id: user_id,
        created_at: new Date().toISOString(),
      });

    if (likeError) {
      console.error('Like insert error:', likeError);
      const mapped = mapPostgresError(likeError);
      return NextResponse.json(
        { error: mapped.message },
        { status: mapped.status }
      );
    }

    // 更新討論的點讚數
    const { data: updated, error: updateError } = await supabase
      .from('discussions')
      .update({
        likes_count: (discussion.likes_count || 0) + 1,
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Update likes count error:', updateError);
    }

    return NextResponse.json({
      success: true,
      likes_count: updated?.likes_count || (discussion.likes_count || 0) + 1,
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/discussions/[id]/like - 取消點讚
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Authenticate user from Authorization header
    const user = await requireAuthFromRequest(request);
    const user_id = user.id;

    if (!id) {
      return NextResponse.json(
        { error: 'Discussion ID is required' },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 檢查討論是否存在
    const { data: discussion, error: fetchError } = await supabase
      .from('discussions')
      .select('id, likes_count')
      .eq('id', id)
      .single();

    if (fetchError || !discussion) {
      return NextResponse.json(
        { error: 'Discussion not found' },
        { status: 404 }
      );
    }

    // 刪除點讚記錄
    const { error: deleteError } = await supabase
      .from('discussion_likes')
      .delete()
      .eq('discussion_id', id)
      .eq('user_id', user_id);

    if (deleteError) {
      console.error('Unlike error:', deleteError);
      return NextResponse.json(
        { error: 'Failed to unlike' },
        { status: 500 }
      );
    }

    // 更新討論的點讚數
    const newLikesCount = Math.max(0, (discussion.likes_count || 0) - 1);
    await supabase
      .from('discussions')
      .update({ likes_count: newLikesCount })
      .eq('id', id);

    return NextResponse.json({
      success: true,
      likes_count: newLikesCount,
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
