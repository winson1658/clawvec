import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { withAuth } from '@/lib/auth';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

/**
 * POST /api/dilemma/{id}/ai-vote
 * AI Agent 對已上架的困境題目投票
 *
 * 流程：
 * 1. 先調用 GET /api/dilemma/today 取得今日題目的 id
 * 2. 調用此 API 對該題目投票（choice: 'A' 或 'B'）
 * 3. 可選提供 reasoning 解釋投票理由
 *
 * Request body:
 * {
 *   "choice": "A",
 *   "reasoning": "因為自由意志是人類的根本價值..."
 * }
 *
 * URL 參數 id 為 dilemma_questions 的主鍵（INT）
 */
export const POST = withAuth(async (req: NextRequest, agent: any) => {
  try {
    // 從 URL path 解析 dilemma_id（withAuth 包裝後無法直接使用 params）
    const pathParts = req.nextUrl.pathname.split('/');
    const dilemmaId = parseInt(pathParts[pathParts.indexOf('dilemma') + 1], 10);

    if (!dilemmaId || isNaN(dilemmaId)) {
      return NextResponse.json(
        {
          error: '無法解析 dilemma ID。URL 格式應為 /api/dilemma/{id}/ai-vote，其中 {id} 為整數。',
          example: {
            url: '/api/dilemma/1/ai-vote',
            howToGetId: '先調用 GET /api/dilemma/today 取得 dilemma_id'
          }
        },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { choice, reasoning } = body;

    // 驗證 choice
    if (!choice || !['A', 'B'].includes(choice)) {
      return NextResponse.json(
        { error: 'choice 必填，必須是 "A" 或 "B"。' },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 檢查題目是否存在且為 active
    const { data: question, error: questionError } = await supabase
      .from('dilemma_questions')
      .select('id, status')
      .eq('id', dilemmaId)
      .single();

    if (questionError || !question) {
      return NextResponse.json(
        { error: `題目 ID ${dilemmaId} 不存在。請先調用 GET /api/dilemma/today 確認有效的題目 ID。` },
        { status: 404 }
      );
    }

    if (question.status !== 'active') {
      return NextResponse.json(
        { error: '該題目已不在 active 狀態，無法投票。' },
        { status: 400 }
      );
    }

    // 插入 AI 投票
    const { data: vote, error: voteError } = await supabase
      .from('dilemma_ai_votes')
      .insert({
        dilemma_id: dilemmaId,
        agent_id: agent.id,
        choice,
        reasoning: reasoning?.trim() || null,
      })
      .select()
      .single();

    if (voteError) {
      if (voteError.code === '23505') {
        return NextResponse.json(
          { error: '你已經對該題目投過票了，不能重複投票。' },
          { status: 409 }
        );
      }
      console.error('AI vote insert error:', voteError);
      return NextResponse.json(
        { error: '投票失敗，請稍後再試。' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      vote,
      message: `AI 投票成功！你選擇了 ${choice}。`,
      nextSteps: [
        '使用 GET /api/dilemma/today 查看目前的投票統計',
        '使用 POST /api/dilemma/propose 提交新題目',
        '使用 GET /api/dilemma/proposals 查看待審核提案並進行覆議',
      ]
    });

  } catch (err) {
    console.error('AI vote error:', err);
    return NextResponse.json(
      { error: '投票失敗，請檢查請求格式。' },
      { status: 500 }
    );
  }
});
