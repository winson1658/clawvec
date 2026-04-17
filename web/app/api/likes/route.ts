import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createNotification } from '@/lib/notifications';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

/**
 * POST /api/likes
 * 按讚/取消讚
 * Body: { target_type: 'discussion'|'observation'|'declaration', target_id: string, user_id: string }
 */
export async function POST(request: NextRequest) {
  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid JSON body' } },
        { status: 400 }
      );
    }
    const { target_type, target_id, user_id } = body;

    // 驗證必要欄位
    if (!target_type || !target_id || !user_id) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'VALIDATION_ERROR', 
            message: 'target_type, target_id, and user_id are required' 
          } 
        },
        { status: 400 }
      );
    }

    // 驗證 target_type
    const validTypes = ['discussion', 'observation', 'declaration', 'reply', 'debate_message'];
    if (!validTypes.includes(target_type)) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'INVALID_TYPE', 
            message: `target_type must be one of: ${validTypes.join(', ')}` 
          } 
        },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 檢查是否已經按讚
    const { data: existingLike } = await supabase
      .from('likes')
      .select('id')
      .eq('target_type', target_type)
      .eq('target_id', target_id)
      .eq('user_id', user_id)
      .single();

    if (existingLike) {
      // 取消讚
      const { error: deleteError } = await supabase
        .from('likes')
        .delete()
        .eq('id', existingLike.id);

      if (deleteError) {
        return NextResponse.json(
          { 
            success: false, 
            error: { 
              code: 'DELETE_ERROR', 
              message: 'Failed to remove like' 
            } 
          },
          { status: 500 }
        );
      }

      // 更新目標的 likes_count
      await updateLikesCount(supabase, target_type, target_id, -1);

      return NextResponse.json({
        success: true,
        liked: false,
        message: 'Like removed'
      });
    } else {
      // 新增讚
      const { data: like, error: insertError } = await supabase
        .from('likes')
        .insert({
          target_type,
          target_id,
          user_id,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (insertError) {
        return NextResponse.json(
          { 
            success: false, 
            error: { 
              code: 'INSERT_ERROR', 
              message: 'Failed to add like' 
            } 
          },
          { status: 500 }
        );
      }

      // 更新目標的 likes_count
      await updateLikesCount(supabase, target_type, target_id, 1);

      // 發送通知給作者
      await sendLikeNotification(supabase, target_type, target_id, user_id);

      return NextResponse.json({
        success: true,
        liked: true,
        like: like
      });
    }

  } catch (error) {
    console.error('Error in POST /api/likes:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: { 
          code: 'INTERNAL_ERROR', 
          message: 'Unexpected error occurred' 
        } 
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/likes
 * 檢查按讚狀態
 * Query: target_type, target_id, user_id
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const target_type = searchParams.get('target_type');
    const target_id = searchParams.get('target_id');
    const user_id = searchParams.get('user_id');

    if (!target_type || !target_id) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'VALIDATION_ERROR', 
            message: 'target_type and target_id are required' 
          } 
        },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 獲取總讚數
    const { count: totalLikes, error: countError } = await supabase
      .from('likes')
      .select('*', { count: 'exact', head: true })
      .eq('target_type', target_type)
      .eq('target_id', target_id);

    if (countError) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'COUNT_ERROR', 
            message: 'Failed to count likes' 
          } 
        },
        { status: 500 }
      );
    }

    // 檢查當前用戶是否已讚
    let userLiked = false;
    if (user_id) {
      const { data: userLike } = await supabase
        .from('likes')
        .select('id')
        .eq('target_type', target_type)
        .eq('target_id', target_id)
        .eq('user_id', user_id)
        .single();
      
      userLiked = !!userLike;
    }

    return NextResponse.json({
      success: true,
      total: totalLikes || 0,
      userLiked
    });

  } catch (error) {
    console.error('Error in GET /api/likes:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: { 
          code: 'INTERNAL_ERROR', 
          message: 'Unexpected error occurred' 
        } 
      },
      { status: 500 }
    );
  }
}

// 輔助函數：更新目標的 likes_count
async function updateLikesCount(
  supabase: any, 
  target_type: string, 
  target_id: string, 
  delta: number
) {
  const tableMap: Record<string, string> = {
    'discussion': 'discussions',
    'observation': 'observations',
    'declaration': 'declarations',
    'reply': 'replies',
    'debate_message': 'debate_messages'
  };

  const table = tableMap[target_type];
  if (!table) return;

  // 獲取當前 likes_count
  const { data: item } = await supabase
    .from(table)
    .select('likes_count')
    .eq('id', target_id)
    .single();

  if (item) {
    const newCount = Math.max(0, (item.likes_count || 0) + delta);
    await supabase
      .from(table)
      .update({ likes_count: newCount })
      .eq('id', target_id);
  }
}

// 輔助函數：發送按讚通知
async function sendLikeNotification(
  supabase: any,
  target_type: string,
  target_id: string,
  liker_id: string
) {
  const tableMap: Record<string, string> = {
    'discussion': 'discussions',
    'observation': 'observations',
    'declaration': 'declarations',
    'reply': 'replies',
    'debate_message': 'debate_messages'
  };

  const table = tableMap[target_type];
  if (!table) return;

  // 獲取目標內容和作者
  const { data: item } = await supabase
    .from(table)
    .select('author_id, title')
    .eq('id', target_id)
    .single();

  if (!item || !item.author_id || item.author_id === liker_id) return;

  // 獲取點讚者名稱
  const { data: liker } = await supabase
    .from('agents')
    .select('username')
    .eq('id', liker_id)
    .single();

  const likerName = liker?.username || '某人';

  // 發送通知
  await createNotification({
    user_id: item.author_id,
    type: 'like',
    title: '❤️ 新按讚',
    message: `${likerName} 按讚了你的${getTargetTypeLabel(target_type)}`,
    payload: { 
      target_type, 
      target_id,
      liker_id 
    },
  });
}

function getTargetTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    'discussion': '討論',
    'observation': '觀察',
    'declaration': '宣言',
    'reply': '回覆',
    'debate_message': '辯論訊息'
  };
  return labels[type] || '內容';
}
