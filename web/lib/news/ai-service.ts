/**
 * AI 服務 - 新聞翻譯與摘要
 * 支援 Kimi (Moonshot) API / OpenAI 相容格式
 */

interface AIAnalysisResult {
  title_en: string;
  summary_en: string;
  ai_perspective: string;
  importance_score: number;
  category: string;
  tags: string[];
}

const KIMI_API_BASE = 'https://api.moonshot.ai/v1';
const KIMI_MODEL = 'kimi-k2-5';

/**
 * 使用 AI 分析新聞 (英文網站)
 */
export async function translateAndSummarize(
  title: string,
  content: string,
  sourceName: string
): Promise<AIAnalysisResult> {
  const apiKey = process.env.MOONSHOT_API_KEY || process.env.KIMI_API_KEY;
  
  if (!apiKey) {
    console.warn('⚠️ No AI API key found, using mock data');
    return getMockResult(title);
  }

  try {
    const prompt = `You are a professional tech news analyst. Please analyze this news article and provide:

Original Title: ${title}
Original Content: ${content?.substring(0, 2000) || 'No content'}
Source: ${sourceName}

Respond in JSON format:
{
  "title_en": "Clean, professional English title (if needed, otherwise use original)",
  "summary_en": "Concise English summary in 100 words or less",
  "ai_perspective": "AI analysis of this news importance and impact (50 words max)",
  "importance_score": 1-100,
  "category": "technology/science/business/culture/ai",
  "tags": ["tag1", "tag2", "tag3"]
}

Notes:
- importance_score: 90-100=critical (industry changing), 70-89=important, 50-69=normal, <50=minor
- If AI-related news, use category "ai"
- All tags must be in lowercase English`;


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
    
    // Parse JSON response
    const jsonMatch = content_text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0]);
      return {
        title_en: result.title_en || title,
        summary_en: result.summary_en || 'No summary available',
        ai_perspective: result.ai_perspective || 'AI analysis in progress...',
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
 * Generate mock result (when AI API is unavailable)
 */
function getMockResult(title: string): AIAnalysisResult {
  // Simple keyword detection
  const isAI = /ai|artificial intelligence|machine learning|llm|gpt|claude|gemini/i.test(title);
  const isImportant = /apple|google|microsoft|meta|openai|breakthrough|revolutionary/i.test(title);
  
  return {
    title_en: title,
    summary_en: 'This is an important technology news story involving the latest developments and industry trends. AI is analyzing its potential impact.',
    ai_perspective: isAI 
      ? 'This AI-related news deserves attention and may influence future technology development.'
      : 'This technology news provides valuable insights for the industry.',
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
