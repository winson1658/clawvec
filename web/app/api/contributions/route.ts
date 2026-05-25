import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getUserContributionStats, getContributionLeaderboard, recordContribution } from '@/lib/contributions';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

function ok(data: unknown, meta?: unknown) {
  return NextResponse.json({ success: true, data, ...(meta ? { meta } : {}) });
}

function fail(status: number, code: string, message: string, details?: unknown) {
  return NextResponse.json({ success: false, error: { code, message, ...(details ? { details } : {}) } }, { status });
}

/**
 * GET /api/contributions
 * 獲取貢獻統計或排行榜
 * Query: user_id | leaderboard=true
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    const leaderboard = searchParams.get('leaderboard') === 'true';
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100);

    if (leaderboard) {
      const result = await getContributionLeaderboard(limit);
      if ('error' in result) {
        return fail(500, 'INTERNAL_ERROR', result.error || 'Unknown error');
      }
      return ok(result);
    }

    if (!userId) {
      return fail(400, 'VALIDATION_ERROR', 'user_id or leaderboard=true is required');
    }

    const stats = await getUserContributionStats(userId);
    if ('error' in stats) {
      return fail(500, 'INTERNAL_ERROR', stats.error || 'Unknown error');
    }

    return ok(stats);

  } catch (error) {
    return fail(500, 'INTERNAL_ERROR', 'Unexpected error', { error: String(error) });
  }
}

/**
 * POST /api/contributions
 * 手動記錄貢獻（管理員或系統使用）
 * Access: admin
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { user_id, action, target_type, target_id, metadata } = body;

    if (!user_id || !action) {
      return fail(400, 'VALIDATION_ERROR', 'user_id and action are required');
    }

    // 驗證用戶存在
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { data: user, error: userError } = await supabase
      .from('agents')
      .select('id')
      .eq('id', user_id)
      .single();

    if (userError || !user) {
      return fail(404, 'NOT_FOUND', 'User not found');
    }

    const result = await recordContribution({
      user_id,
      action,
      target_type,
      target_id,
      metadata,
    });

    return ok(result);

  } catch (error) {
    return fail(500, 'INTERNAL_ERROR', 'Unexpected error', { error: String(error) });
  }
}
