import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// 每日困境題庫（和前端同步）
const DILEMMA_COUNT = 7;

function getTodayDilemmaId(): number {
  const day = new Date().getDate();
  return (day % DILEMMA_COUNT) + 1;
}

function getTodayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

// 投票表需要在 Supabase 手動建立：
// CREATE TABLE IF NOT EXISTS dilemma_votes (
//   id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
//   date TEXT NOT NULL,
//   dilemma_id INT NOT NULL,
//   choice TEXT NOT NULL CHECK (choice IN ('A', 'B')),
//   voter_hash TEXT NOT NULL,
//   created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
//   UNIQUE(date, voter_hash)
// );
// CREATE INDEX IF NOT EXISTS idx_dilemma_votes_date ON dilemma_votes(date, dilemma_id);

// GET: 取得今日投票結果
export async function GET() {
  try {
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ voteA: 0, voteB: 0, total: 0, dilemmaId: getTodayDilemmaId() });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const today = getTodayKey();
    const dilemmaId = getTodayDilemmaId();

    const { data, error } = await supabase
      .from('dilemma_votes')
      .select('choice')
      .eq('date', today)
      .eq('dilemma_id', dilemmaId);

    if (error) {
      // 表可能不存在，返回空結果
      return NextResponse.json({ voteA: 0, voteB: 0, total: 0, dilemmaId });
    }

    const voteA = data?.filter(v => v.choice === 'A').length || 0;
    const voteB = data?.filter(v => v.choice === 'B').length || 0;

    return NextResponse.json({
      voteA,
      voteB,
      total: voteA + voteB,
      dilemmaId,
      date: today,
    });
  } catch {
    return NextResponse.json({ voteA: 0, voteB: 0, total: 0, dilemmaId: getTodayDilemmaId() });
  }
}

// POST: 投票
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
    const today = getTodayKey();
    const dilemmaId = getTodayDilemmaId();

    // 用 visitor fingerprint 防重複投票（不追蹤身份）
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
      // 表可能不存在，靜默失敗但仍返回成功（前端用 localStorage 備份）
      console.error('Vote insert error:', insertError.message);
    }

    // 返回更新後的結果
    const { data } = await supabase
      .from('dilemma_votes')
      .select('choice')
      .eq('date', today)
      .eq('dilemma_id', dilemmaId);

    const voteA = data?.filter(v => v.choice === 'A').length || 0;
    const voteB = data?.filter(v => v.choice === 'B').length || 0;

    return NextResponse.json({
      success: true,
      voteA,
      voteB,
      total: voteA + voteB,
      dilemmaId,
    });
  } catch (err) {
    console.error('Vote error:', err);
    return NextResponse.json({ error: 'Vote failed' }, { status: 500 });
  }
}
