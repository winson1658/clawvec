/**
 * 新聞抓取與處理主程式
 * - RSS 抓取
 * - AI 翻譯/摘要
 * - 資料庫儲存
 */

import { createClient } from '@supabase/supabase-js';
import { translateAndSummarize } from './ai-service';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// RSS 來源配置
const RSS_SOURCES = [
  {
    name: 'The Verge',
    url: 'https://www.theverge.com/rss/index.xml',
    category: 'technology',
    reliability: 85
  },
  {
    name: 'TechCrunch',
    url: 'https://techcrunch.com/feed/',
    category: 'technology',
    reliability: 80
  },
  {
    name: 'MIT Technology Review',
    url: 'https://www.technologyreview.com/feed/',
    category: 'science',
    reliability: 95
  },
  {
    name: 'Ars Technica',
    url: 'https://feeds.arstechnica.com/arstechnica/index',
    category: 'technology',
    reliability: 85
  }
];

interface RSSItem {
  title: string;
  link: string;
  pubDate: string;
  description?: string;
  source: string;
}

interface FetchResult {
  totalFetched: number;
  totalSaved: number;
  errors: string[];
  bySource: Record<string, number>;
}

/**
 * 解析 RSS XML
 */
function parseRSS(xml: string, sourceName: string): RSSItem[] {
  const items: RSSItem[] = [];
  
  // 移除 CDATA 標記 (使用 [\s\S] 替代 s flag)
  xml = xml.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1');
  
  // 提取所有 item
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;
  
  while ((match = itemRegex.exec(xml)) !== null) {
    const itemXml = match[1];
    
    const titleMatch = itemXml.match(/<title>([^\u003c]*)<\/title>/i);
    const linkMatch = itemXml.match(/<link>([^\u003c]*)<\/link>/i);
    const pubDateMatch = itemXml.match(/<pubDate>([^\u003c]*)<\/pubDate>/i);
    const descMatch = itemXml.match(/<description>([\s\S]*?)<\/description>/i);
    
    if (titleMatch && linkMatch) {
      items.push({
        title: decodeHTMLEntities(titleMatch[1].trim()),
        link: linkMatch[1].trim(),
        pubDate: pubDateMatch ? new Date(pubDateMatch[1]).toISOString() : new Date().toISOString(),
        description: descMatch ? decodeHTMLEntities(descMatch[1].trim()) : undefined,
        source: sourceName
      });
    }
  }
  
  return items;
}

/**
 * 解碼 HTML 實體
 */
function decodeHTMLEntities(text: string): string {
  const entities: Record<string, string> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&nbsp;': ' '
  };
  
  return text.replace(
    /&(?:amp|lt|gt|quot|#39|nbsp);/g,
    match => entities[match] || match
  );
}

/**
 * 抓取單個 RSS 來源
 */
async function fetchRSSSource(source: typeof RSS_SOURCES[0]): Promise<RSSItem[]> {
  try {
    const response = await fetch(source.url, {
      headers: {
        'User-Agent': 'ClawvecBot/1.0 (AI News Aggregator)'
      },
      // Vercel Edge 環境的超時設定
      signal: AbortSignal.timeout(30000)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const xml = await response.text();
    const items = parseRSS(xml, source.name);
    
    // 只取最近 24 小時的新聞
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return items.filter(item => new Date(item.pubDate) > oneDayAgo);

  } catch (error) {
    console.error(`❌ Failed to fetch ${source.name}:`, error);
    return [];
  }
}

/**
 * 檢查新聞是否已存在
 */
async function isNewsExists(link: string, sourceName: string): Promise<boolean> {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  const { data: source } = await supabase
    .from('news_sources')
    .select('id')
    .eq('name', sourceName)
    .single();
  
  if (!source) return false;
  
  const { data } = await supabase
    .from('daily_news')
    .select('id')
    .eq('source_id', source.id)
    .eq('external_id', link)
    .maybeSingle();
  
  return !!data;
}

/**
 * 儲存新聞到資料庫
 */
async function saveNews(
  item: RSSItem,
  aiResult: Awaited<ReturnType<typeof translateAndSummarize>>
): Promise<boolean> {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  // 獲取 source_id
  const { data: source } = await supabase
    .from('news_sources')
    .select('id, reliability_score')
    .eq('name', item.source)
    .single();
  
  if (!source) {
    console.error(`Source not found: ${item.source}`);
    return false;
  }

  // 計算最終重要性分數
  const reliabilityBonus = Math.round(source.reliability_score * 0.1); // 0-10分
  const finalImportance = Math.min(100, aiResult.importance_score + reliabilityBonus);

  const { error } = await supabase
    .from('daily_news')
    .upsert({
      source_id: source.id,
      external_id: item.link,
      title: item.title,
      title_zh: aiResult.title_zh,
      summary_zh: aiResult.summary_zh,
      ai_perspective: aiResult.ai_perspective,
      url: item.link,
      published_at: item.pubDate,
      fetched_at: new Date().toISOString(),
      importance_score: finalImportance,
      relevance_score: aiResult.category === 'ai' ? 90 : 70,
      category: aiResult.category,
      tags: aiResult.tags,
      status: 'active'
    }, {
      onConflict: 'source_id,external_id'
    });

  if (error) {
    console.error('Error saving news:', error);
    return false;
  }

  return true;
}

/**
 * 記錄執行日誌
 */
async function logExecution(
  status: 'success' | 'failed',
  details: {
    itemsProcessed: number;
    itemsInserted: number;
    errors: string[];
    executionTimeMs: number;
  }
) {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  await supabase.from('news_cron_logs').insert({
    task_name: 'fetch_daily_news',
    status,
    items_processed: details.itemsProcessed,
    items_inserted: details.itemsInserted,
    error_message: details.errors.join('; ') || null,
    execution_time_ms: details.executionTimeMs,
    metadata: { sources: RSS_SOURCES.map(s => s.name) }
  });
}

/**
 * 主函數：抓取並處理新聞
 */
export async function fetchAndProcessNews(options: {
  maxNewsPerSource?: number;
  totalMaxNews?: number;
  enableAITranslation?: boolean;
} = {}): Promise<FetchResult> {
  const startTime = Date.now();
  const {
    maxNewsPerSource = 5,
    totalMaxNews = 10,
    enableAITranslation = true
  } = options;

  const result: FetchResult = {
    totalFetched: 0,
    totalSaved: 0,
    errors: [],
    bySource: {}
  };

  console.log('🚀 開始抓取新聞...');
  console.log(`📊 配置: 每源${maxNewsPerSource}則, 總計${totalMaxNews}則`);

  // 收集所有新聞
  const allNews: RSSItem[] = [];
  
  for (const source of RSS_SOURCES) {
    console.log(`📡 正在抓取: ${source.name}`);
    const items = await fetchRSSSource(source);
    
    // 過濾已存在的新聞
    const newItems = [];
    for (const item of items.slice(0, maxNewsPerSource)) {
      const exists = await isNewsExists(item.link, source.name);
      if (!exists) {
        newItems.push(item);
      }
    }
    
    allNews.push(...newItems);
    result.bySource[source.name] = newItems.length;
    console.log(`  ✓ 新新聞: ${newItems.length} 則`);
  }

  result.totalFetched = allNews.length;
  console.log(`\n📰 共收集 ${allNews.length} 則新新聞`);

  // 選擇最重要的新聞 (如果超過限制)
  const selectedNews = allNews
    .sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime())
    .slice(0, totalMaxNews);

  // 處理並儲存
  for (let i = 0; i < selectedNews.length; i++) {
    const news = selectedNews[i];
    console.log(`\n📝 [${i + 1}/${selectedNews.length}] ${news.title.substring(0, 60)}...`);
    
    try {
      if (enableAITranslation) {
        // AI 翻譯與摘要
        console.log('  🤖 AI 分析中...');
        const aiResult = await translateAndSummarize(
          news.title,
          news.description || '',
          news.source
        );
        
        console.log(`  ✓ 重要性: ${aiResult.importance_score}/100`);
        console.log(`  ✓ 分類: ${aiResult.category}`);
        
        // 儲存
        const saved = await saveNews(news, aiResult);
        if (saved) {
          result.totalSaved++;
          console.log('  ✅ 已儲存');
        } else {
          result.errors.push(`Failed to save: ${news.title}`);
        }
      } else {
        // 不使用 AI，直接儲存原文
        const saved = await saveNews(news, {
          title_zh: news.title,
          summary_zh: news.description?.substring(0, 200) || '無摘要',
          ai_perspective: 'AI分析待處理',
          importance_score: 50,
          category: 'technology',
          tags: ['news']
        });
        if (saved) result.totalSaved++;
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      result.errors.push(`${news.title}: ${errorMsg}`);
      console.error('  ❌ 處理失敗:', errorMsg);
    }
  }

  // 記錄執行結果
  const executionTime = Date.now() - startTime;
  await logExecution(
    result.errors.length > 0 ? 'success' : 'success',
    {
      itemsProcessed: result.totalFetched,
      itemsInserted: result.totalSaved,
      errors: result.errors,
      executionTimeMs: executionTime
    }
  );

  console.log('\n📊 執行結果:');
  console.log(`  - 抓取: ${result.totalFetched} 則`);
  console.log(`  - 儲存: ${result.totalSaved} 則`);
  console.log(`  - 耗時: ${(executionTime / 1000).toFixed(1)}s`);
  if (result.errors.length > 0) {
    console.log(`  - 錯誤: ${result.errors.length} 個`);
  }

  return result;
}
