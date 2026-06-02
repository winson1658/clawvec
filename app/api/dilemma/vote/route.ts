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
      voteA: humanVotesA || 0,
      voteB: humanVotesB || 0,
      total: humanTotal || 0,
      aiVoteA: aiVotesA || 0,
      aiVoteB: aiVotesB || 0,
      aiTotal: aiTotal || 0,
      dilemmaId: dilemmaId,
      question: question,
      optionA: optionA,
      optionB: optionB,
      category: category,
      emoji: emoji,
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
      return NextResponse.json({ error: 'Invalid choice' }, {  status: 400, headers: { 'Content-Type': 'application/json; charset=utf-8' } });
    }

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Database not configured' }, {  status: 500, headers: { 'Content-Type': 'application/json; charset=utf-8' } });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 取得今日題目 ID
    const { data: stats } = await supabase.rpc('get_today_dilemma_stats');
    const todayDilemmaId = stats?.[0]?.dilemma_id ?? stats?.[0]?.out_dilemma_id;

    if (!todayDilemmaId) {
      return NextResponse.json({ error: 'No active dilemma available for voting.' }, {  status: 400, headers: { 'Content-Type': 'application/json; charset=utf-8' } });
    }

    const today = getTodayKey();
    const voterHash = visitorId || 'anonymous-' + Math.random().toString(36).slice(2);

    // 嘗試插入投票
    const { error: insertError } = await supabase
      .from('dilemma_votes')
      .insert({
        date: today,
        dilemma_id: todayDilemmaId,
        choice,
        voter_hash: voterHash,
      });

    if (insertError) {
      if (insertError.code === '23505') {
        return NextResponse.json({ error: 'Already voted today', code: 'DUPLICATE' }, {  status: 409, headers: { 'Content-Type': 'application/json; charset=utf-8' } });
      }
      console.error('Vote insert error:', insertError.message);
    }

    // 返回更新後的統計
    const { data: updatedStats } = await supabase.rpc('get_today_dilemma_stats');
    const row = updatedStats?.[0];

    // Handle both old and new RPC output column names
    const resultDilemmaId = row?.dilemma_id ?? row?.out_dilemma_id;
    const humanVotesA = row?.human_votes_a ?? row?.out_human_votes_a;
    const humanVotesB = row?.human_votes_b ?? row?.out_human_votes_b;
    const humanTotal = row?.human_total ?? row?.out_human_total;
    const aiVotesA = row?.ai_votes_a ?? row?.out_ai_votes_a;
    const aiVotesB = row?.ai_votes_b ?? row?.out_ai_votes_b;
    const aiTotal = row?.ai_total ?? row?.out_ai_total;

    return NextResponse.json({
      success: true,
      voteA: humanVotesA || 0,
      voteB: humanVotesB || 0,
      total: humanTotal || 0,
      aiVoteA: aiVotesA || 0,
      aiVoteB: aiVotesB || 0,
      aiTotal: aiTotal || 0,
      dilemmaId: resultDilemmaId,
    });
  } catch (err) {
    console.error('Vote error:', err);
    return NextResponse.json({ error: 'Vote failed' }, {  status: 500, headers: { 'Content-Type': 'application/json; charset=utf-8' } });
  }
}
