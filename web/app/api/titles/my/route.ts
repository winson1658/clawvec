import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

function ok(data: unknown) {
  return NextResponse.json({ success: true, data });
}

function fail(status: number, code: string, message: string, details?: unknown) {
  return NextResponse.json({ success: false, error: { code, message, ...(details ? { details } : {}) } }, { status });
}

/**
 * GET /api/titles/my
 * 獲取我的封號
 * Access: authed
 * Action: titles.my.get
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');

    if (!userId) {
      return fail(400, 'VALIDATION_ERROR', 'user_id is required');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 獲取用戶持有的所有封號
    const { data: userTitles, error } = await supabase
      .from('user_titles')
      .select(`
        title_id,
        earned_at,
        is_displayed,
        titles!inner(id, display_name, description, rarity, hint, is_hidden, family_id)
      `)
      .eq('user_id', userId)
      .order('earned_at', { ascending: false });

    if (error) return fail(500, 'INTERNAL_ERROR', 'Failed to fetch titles', { message: error.message });

    // 格式化回應
    const earned = (userTitles || []).map((ut: any) => ({
      title_id: ut.title_id,
      display_name: ut.titles.display_name,
      description: ut.titles.is_hidden ? undefined : ut.titles.description,
      hint: ut.titles.hint,
      rarity: ut.titles.rarity,
      category: ut.titles.family_id,
      is_hidden: ut.titles.is_hidden,
      earned_at: ut.earned_at,
      is_displayed: ut.is_displayed,
    }));

    const displayed = earned
      .filter((t: any) => t.is_displayed)
      .map((t: any) => t.title_id);

    return ok({
      earned,
      displayed,
      total: earned.length,
      displayed_count: displayed.length
    });

  } catch (error) {
    return fail(500, 'INTERNAL_ERROR', 'Unexpected error', { error: String(error) });
  }
}

/**
 * PATCH /api/titles/my
 * 設定展示的封號
 * Access: authed
 * Action: titles.my.set_displayed
 * Rules: 最多 3 個，必須持有
 */
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { user_id, displayed = [] } = body;

    if (!user_id) {
      return fail(400, 'VALIDATION_ERROR', 'user_id is required');
    }

    // 驗證數量
    if (displayed.length > 3) {
      return fail(400, 'VALIDATION_ERROR', 'Cannot display more than 3 titles', {
        max: 3,
        requested: displayed.length
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 驗證是否都持有這些封號
    if (displayed.length > 0) {
      const { data: owned } = await supabase
        .from('user_titles')
        .select('title_id')
        .eq('user_id', user_id)
        .in('title_id', displayed);

      const ownedIds = (owned || []).map((o: any) => o.title_id);
      const notOwned = displayed.filter((id: string) => !ownedIds.includes(id));

      if (notOwned.length > 0) {
        return fail(403, 'FORBIDDEN', 'Some titles are not owned', {
          code: 'TITLE_NOT_OWNED',
          not_owned: notOwned
        });
      }
    }

    // 重置所有為不展示
    await supabase
      .from('user_titles')
      .update({ is_displayed: false })
      .eq('user_id', user_id);

    // 設定選擇的為展示
    if (displayed.length > 0) {
      const { error } = await supabase
        .from('user_titles')
        .update({ is_displayed: true })
        .eq('user_id', user_id)
        .in('title_id', displayed);

      if (error) return fail(500, 'INTERNAL_ERROR', 'Failed to update displayed titles', { message: error.message });
    }

    return ok({ displayed });

  } catch (error) {
    return fail(500, 'INTERNAL_ERROR', 'Unexpected error', { error: String(error) });
  }
}
