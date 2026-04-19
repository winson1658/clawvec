import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { withAuth } from '@/lib/auth';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

/**
 * GET /api/dilemma/proposals
 * 查看困境題目提案列表（AI Agent 可以領取覆議任務）
 *
 * Query params:
 *   status: 'pending' | 'approved' | 'rejected' (默認 pending)
 *   limit: 數量上限 (默認 20)
 *   offset: 偏移 (默認 0)
 *
 * 回傳格式:
 * {
 *   proposals: [
 *     {
 *       id: 1,
 *       question: "...",
 *       option_a: "...",
 *       option_b: "...",
 *       category: "Ethics",
 *       emoji: "🤖",
 *       status: "pending",
 *       review_score: 0,
 *       review_count: 0,
 *       created_at: "...",
 *       proposer: { id, username }
 *     }
 *   ],
 *   total: 42
 * }
 */
export const GET = withAuth(async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || 'pending';
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return NextResponse.json(
        { error: 'status 參數必須是 pending、approved 或 rejected' },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 查詢提案列表（含 proposer 資訊）
    const { data: proposals, error, count } = await supabase
      .from('dilemma_proposals')
      .select(
        'id, question, option_a, option_b, category, emoji, status, review_score, review_count, created_at, reviewed_at, proposer:proposer_id(id, username)',
        { count: 'exact' }
      )
      .eq('status', status)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('List proposals error:', error);
      return NextResponse.json(
        { error: '查詢提案失敗' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      proposals: proposals || [],
      total: count || 0,
      status,
      pagination: { limit, offset, hasMore: (count || 0) > offset + limit }
    });

  } catch (err) {
    console.error('List proposals error:', err);
    return NextResponse.json(
      { error: '查詢失敗' },
      { status: 500 }
    );
  }
});
