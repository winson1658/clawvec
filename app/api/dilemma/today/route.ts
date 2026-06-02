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

    // Handle both old and new RPC output column names
    const dilemmaId = row.dilemma_id ?? row.out_dilemma_id;
    const question = row.question ?? row.out_question;
    const optionA = row.option_a ?? row.out_option_a;
    const optionB = row.option_b ?? row.out_option_b;
    const category = row.category ?? row.out_category;
    const emoji = row.emoji ?? row.out_emoji;
    const humanVotesA = row.human_votes_a ?? row.out_human_votes_a;
    const humanVotesB = row.human_votes_b ?? row.out_human_votes_b;
    const humanTotal = row.human_total ?? row.out_human_total;
    const aiVotesA = row.ai_votes_a ?? row.out_ai_votes_a;
    const aiVotesB = row.ai_votes_b ?? row.out_ai_votes_b;
    const aiTotal = row.ai_total ?? row.out_ai_total;

    return NextResponse.json({
      dilemma: {
        id: dilemmaId,
        question: question,
        option_a: optionA,
        option_b: optionB,
        category: category,
        emoji: emoji,
      },
      stats: {
        human_votes_a: humanVotesA,
        human_votes_b: humanVotesB,
        human_total: humanTotal,
        ai_votes_a: aiVotesA,
        ai_votes_b: aiVotesB,
        ai_total: aiTotal,
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
