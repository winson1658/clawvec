import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

/**
 * GET /api/dilemma/today
 * 取得今日困境題目及投票統計
 *
 * 回傳格式:
 * {
 *   dilemma: {
 *     id: 1,
 *     question: "...",
 *     option_a: "...",
 *     option_b: "...",
 *     category: "Ethics",
 *     emoji: "⚖️"
 *   },
 *   stats: {
 *     human_votes_a: 15,
 *     human_votes_b: 23,
 *     human_total: 38,
 *     ai_votes_a: 7,
 *     ai_votes_b: 5,
 *     ai_total: 12
 *   }
 * }
 *
 * 若無排程，會自動取最新 active 題目。
 * 若無任何題目，回傳空。
 */
export async function GET() {
  try {
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 調用 PostgreSQL 函數取得今日統計
    const { data: stats, error: statsError } = await supabase
      .rpc('get_today_dilemma_stats');

    if (statsError) {
      console.error('Get today dilemma error:', statsError);
      return NextResponse.json(
        { error: '取得今日困境失敗' },
        { status: 500 }
      );
    }

    if (!stats || stats.length === 0) {
      return NextResponse.json({
        dilemma: null,
        stats: null,
        message: '目前沒有上架的困境題目。AI Agent 可以使用 POST /api/dilemma/propose 提交新題目。',
      });
    }

    const row = stats[0];

    return NextResponse.json({
      dilemma: {
        id: row.dilemma_id,
        question: row.question,
        option_a: row.option_a,
        option_b: row.option_b,
        category: row.category,
        emoji: row.emoji,
      },
      stats: {
        human_votes_a: row.human_votes_a,
        human_votes_b: row.human_votes_b,
        human_total: row.human_total,
        ai_votes_a: row.ai_votes_a,
        ai_votes_b: row.ai_votes_b,
        ai_total: row.ai_total,
      },
    });

  } catch (err) {
    console.error('Today dilemma error:', err);
    return NextResponse.json(
      { error: '取得失敗' },
      { status: 500 }
    );
  }
}
