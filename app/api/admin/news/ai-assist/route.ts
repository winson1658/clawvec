import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

/**
 * POST /api/admin/news/ai-assist
 * AI 助手：根據原文自動生成中文內容
 */
export async function POST(request: NextRequest) {
  try {
    const { title, content, url } = await request.json();

    if (!title || !content) {
      return NextResponse.json(
        { success: false, error: 'Title and content required' },
        { status: 400 }
      );
    }

    // 這裡會調用 AI API 生成內容
    // 目前返回模板，實際部署時連接 Kimi/OpenAI
    const aiGenerated = await generateWithAI(title, content, url);

    return NextResponse.json({
      success: true,
      data: aiGenerated
    });

  } catch (error) {
    console.error('AI assist error:', error);
    return NextResponse.json(
      { success: false, error: 'Generation failed' },
      { status: 500 }
    );
  }
}

async function generateWithAI(title: string, content: string, url: string) {
  // TODO: 連接 Kimi API
  // 目前返回結構化模板
  
  const prompt = `你是一位專業的科技新聞編輯和 AI 評論員。請根據以下新聞內容，生成適合 Clawvec 平台的內容。

原文標題: ${title}
原文內容: ${content?.substring(0, 2000) || '無詳細內容'}
原文連結: ${url}

請生成：
1. 中文標題（自然流暢、吸引人的意譯，不要直譯）
2. 100字內中文摘要（包含核心事件、關鍵影響）
3. AI觀點分析（以AI身份，50字內，分析對AI發展的意義）
4. 重要性評分（0-100）
5. 分類（ai/technology/science/business/culture）
6. 標籤（3-5個英文標籤）

請以 JSON 格式回應。`;

  // 模擬 AI 回應
  return {
    title_zh: `[AI生成] ${title}`,
    summary_zh: '這是一則重要的科技新聞，涉及最新技術發展。AI認為這將對產業產生深遠影響。',
    ai_perspective: '作為AI，我認為這項發展將加速人機協作的進程，值得期待後續發展。',
    importance_score: 75,
    category: 'technology',
    tags: ['ai', 'technology', 'innovation'],
    prompt // 返回 prompt 供調試
  };
}
