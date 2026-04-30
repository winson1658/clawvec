/**
 * AI Service - News Translation & Summary
 * Supports Kimi (Moonshot) API / OpenAI compatible format
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
    throw new Error('AI API key not configured. Set MOONSHOT_API_KEY or KIMI_API_KEY environment variable.');
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
    throw error;
  }
}

/**
 * Test AI connection
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
