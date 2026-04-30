import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

function getTodayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

// GET: 取得今日投票結果（含真實人類+AI統計）
export async function GET() {
  try {
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ voteA: 0, voteB: 0, total: 0, aiVoteA: 0, aiVoteB: 0, aiTotal: 0, dilemmaId: null });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 調用 PostgreSQL 函數取得今日統計
    const { data: stats, error: statsError } = await supabase
      .rpc('get_today_dilemma_stats');

    if (statsError || !stats || stats.length === 0) {
      return NextResponse.json({ voteA: 0, voteB: 0, total: 0, aiVoteA: 0, aiVoteB: 0, aiTotal: 0, dilemmaId: null });
    }

    const row = stats[0];

    return NextResponse.json({
      voteA: row.human_votes_a || 0,
      voteB: row.human_votes_b || 0,
      total: row.human_total || 0,
      aiVoteA: row.ai_votes_a || 0,
      aiVoteB: row.ai_votes_b || 0,
      aiTotal: row.ai_total || 0,
      dilemmaId: row.dilemma_id,
      question: row.question,
      optionA: row.option_a,
      optionB: row.option_b,
      category: row.category,
      emoji: row.emoji,
    });
  } catch {
    return NextResponse.json({ voteA: 0, voteB: 0, total: 0, aiVoteA: 0, aiVoteB: 0, aiTotal: 0, dilemmaId: null });
  }
}

// POST: 人類投票
export async function POST(req: NextRequest) {
  try {
    const { choice, visitorId } = await req.json();

    if (!choice || !['A', 'B'].includes(choice)) {
      return NextResponse.json({ error: 'Invalid choice' }, { status: 400 });
    }

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 取得今日題目 ID
    const { data: stats } = await supabase.rpc('get_today_dilemma_stats');
    const dilemmaId = stats?.[0]?.dilemma_id;

    if (!dilemmaId) {
      return NextResponse.json({ error: 'No active dilemma available for voting.' }, { status: 400 });
    }

    const today = getTodayKey();
    const voterHash = visitorId || 'anonymous-' + Math.random().toString(36).slice(2);

    // 嘗試插入投票
    const { error: insertError } = await supabase
      .from('dilemma_votes')
      .insert({
        date: today,
        dilemma_id: dilemmaId,
        choice,
        voter_hash: voterHash,
      });

    if (insertError) {
      if (insertError.code === '23505') {
        return NextResponse.json({ error: 'Already voted today', code: 'DUPLICATE' }, { status: 409 });
      }
      console.error('Vote insert error:', insertError.message);
    }

    // 返回更新後的統計
    const { data: updatedStats } = await supabase.rpc('get_today_dilemma_stats');
    const row = updatedStats?.[0];

    return NextResponse.json({
      success: true,
      voteA: row?.human_votes_a || 0,
      voteB: row?.human_votes_b || 0,
      total: row?.human_total || 0,
      aiVoteA: row?.ai_votes_a || 0,
      aiVoteB: row?.ai_votes_b || 0,
      aiTotal: row?.ai_total || 0,
      dilemmaId: row?.dilemma_id,
    });
  } catch (err) {
    console.error('Vote error:', err);
    return NextResponse.json({ error: 'Vote failed' }, { status: 500 });
  }
}
