/**
 * AI 服務 - 新聞翻譯與摘要
 * 支援 Kimi (Moonshot) API / OpenAI 相容格式
 */

interface AITranslationResult {
  title_zh: string;
  summary_zh: string;
  ai_perspective: string;
  importance_score: number;
  category: string;
  tags: string[];
}

const KIMI_API_BASE = 'https://api.moonshot.ai/v1';
const KIMI_MODEL = 'kimi-k2-5';

/**
 * 使用 AI 翻譯和摘要新聞
 */
export async function translateAndSummarize(
  title: string,
  content: string,
  sourceName: string
): Promise<AITranslationResult> {
  const apiKey = process.env.MOONSHOT_API_KEY || process.env.KIMI_API_KEY;
  
  if (!apiKey) {
    console.warn('⚠️ No AI API key found, using mock data');
    return getMockResult(title);
  }

  try {
    const prompt = `你是一位專業的科技新聞編輯，請分析這則新聞並提供以下資訊：

原文標題: ${title}
原文內容: ${content?.substring(0, 2000) || '無內容'}
來源: ${sourceName}

請以 JSON 格式回應：
{
  "title_zh": "中文標題（自然流暢，非直譯）",
  "summary_zh": "100字內中文摘要",
  "ai_perspective": "以AI角度分析這則新聞的重要性與影響（50字內）",
  "importance_score": 1-100,
  "category": "technology/science/business/culture/ai",
  "tags": ["相關標籤1", "標籤2", "標籤3"]
}

注意：
- importance_score: 90-100=極重要(產業變革), 70-89=重要, 50-69=一般, <50=次要
- 若是AI相關新聞，category請填"ai"
- 標籤請用英文，方便系統處理`;

    const response = await fetch(`${KIMI_API_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: KIMI_MODEL,
        messages: [
          { role: 'system', content: 'You are a professional tech news editor and AI analyst.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 800
      })
    });

    if (!response.ok) {
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const content_text = data.choices?.[0]?.message?.content || '';
    
    // 解析 JSON 回應
    const jsonMatch = content_text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0]);
      return {
        title_zh: result.title_zh || title,
        summary_zh: result.summary_zh || '無摘要',
        ai_perspective: result.ai_perspective || 'AI分析中...',
        importance_score: Math.min(100, Math.max(0, result.importance_score || 50)),
        category: result.category || 'technology',
        tags: result.tags || []
      };
    }

    throw new Error('Failed to parse AI response');

  } catch (error) {
    console.error('AI translation error:', error);
    return getMockResult(title);
  }
}

/**
 * 生成模擬結果（當 AI API 不可用時）
 */
function getMockResult(title: string): AITranslationResult {
  // 簡單關鍵詞判斷
  const isAI = /ai|artificial intelligence|machine learning|llm|gpt|claude|gemini/i.test(title);
  const isImportant = /apple|google|microsoft|meta|openai|breakthrough|revolutionary/i.test(title);
  
  return {
    title_zh: `[AI翻譯] ${title}`,
    summary_zh: '這是一則重要的科技新聞，涉及最新技術發展與產業動態。AI正在分析其對未來的影響。',
    ai_perspective: isAI 
      ? '這則AI相關新聞值得關注，可能影響未來技術發展方向。'
      : '這則科技新聞對產業有重要參考價值。',
    importance_score: isImportant ? 85 : (isAI ? 75 : 60),
    category: isAI ? 'ai' : 'technology',
    tags: isAI ? ['ai', 'technology', 'innovation'] : ['technology', 'news']
  };
}

/**
 * 測試 AI 連線
 */
export async function testAIConnection(): Promise<boolean> {
  const apiKey = process.env.MOONSHOT_API_KEY || process.env.KIMI_API_KEY;
  if (!apiKey) return false;

  try {
    const response = await fetch(`${KIMI_API_BASE}/models`, {
      headers: { 'Authorization': `Bearer ${apiKey}` }
    });
    return response.ok;
  } catch {
    return false;
  }
}
