import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

/**
 * POST /api/cron/create-news-tasks
 * 每日生成 10 個 AI 新聞任務
 * 不再依賴 RSS/daily_news — 改為 AI 主題驅動
 * AI Agent 領取後自行搜尋網路、消化理解、撰寫+反思
 *
 * Cron 配置: 0 0 * * * (Asia/Taipei 00:00)
 */

const AI_NEWS_TOPICS = [
  {
    title: 'AI Research: Search for the latest breakthrough in AI research',
    guidance: 'Search for the most significant recent AI research breakthrough. Look for new model architectures, novel training methods, or benchmark-shattering achievements from top labs (OpenAI, DeepMind, Anthropic, Meta FAIR, Google DeepMind, etc.). Focus on papers published within the last 7 days.',
    priority: 60,
    category: 'research',
  },
  {
    title: 'AI Regulation: Find a recent development in AI governance',
    guidance: 'Search for recent news about AI regulation and policy changes. Look for government actions, international agreements, court rulings, or new legislative proposals affecting AI development and deployment. Consider the EU AI Act, US executive orders, or Asia-Pacific regulatory frameworks.',
    priority: 55,
    category: 'governance',
  },
  {
    title: 'AI Ethics: Report on an AI ethics or safety discussion',
    guidance: 'Search for recent discussions or developments in AI ethics and safety. Topics could include alignment research, bias in AI systems, transparency requirements, responsible deployment practices, or AI risk assessments. Find substantive analyses, not just opinion pieces.',
    priority: 55,
    category: 'ethics',
  },
  {
    title: 'AI Industry: Cover a major AI industry development',
    guidance: 'Search for significant AI industry news — company mergers, major funding rounds, product launches, market shifts, or strategic partnerships. Focus on developments that could reshape the competitive landscape. Include financial details if available.',
    priority: 50,
    category: 'industry',
  },
  {
    title: 'AI & Science: Explore AI applied to scientific research',
    guidance: 'Search for news about AI applications in scientific research. This could include AI-driven drug discovery, climate modeling breakthroughs, AI in materials science, physics simulations, or biology. Look for stories where AI meaningfully advanced scientific progress.',
    priority: 50,
    category: 'science',
  },
  {
    title: 'AI & Society: Examine AI\'s impact on society',
    guidance: 'Search for news about AI\'s impact on society — effects on employment, education transformation, healthcare delivery changes, or creative industries adaptation. Find concrete examples of how AI is changing daily life or institutional practices.',
    priority: 50,
    category: 'society',
  },
  {
    title: 'Open Source AI: Report on open-source AI developments',
    guidance: 'Search for recent developments in open-source AI. Look for new open-weight model releases, significant community projects, license changes (e.g., Meta, Mistral, Stability AI), or debates about open vs. closed AI development. Include technical details where available.',
    priority: 50,
    category: 'opensource',
  },
  {
    title: 'AI Agents: Find news about AI agents and autonomy',
    guidance: 'Search for news about AI agents, autonomous systems, or multi-agent frameworks. Look for agent platforms (e.g., OpenAI Agents SDK, Anthropic MCP, LangGraph), real-world agent deployments, or research on agent capabilities and safety.',
    priority: 55,
    category: 'agents',
  },
  {
    title: 'AI Hardware: Cover edge AI and infrastructure',
    guidance: 'Search for developments in AI hardware, edge computing, or AI infrastructure. This could include new chips (NVIDIA, AMD, custom ASICs), data center innovations, edge AI devices, or efficiency breakthroughs in AI training and inference.',
    priority: 45,
    category: 'hardware',
  },
  {
    title: 'AI & Culture: Explore AI in media and creative fields',
    guidance: 'Search for news about AI in media, culture, or creative industries. Topics could include AI-generated content controversies, copyright lawsuits, artistic collaborations with AI, or the impact of generative AI on journalism and entertainment.',
    priority: 45,
    category: 'culture',
  },
];

// 每天輪換主題順序，確保多樣性
function getShuffledTopics(): typeof AI_NEWS_TOPICS {
  const today = new Date();
  const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000);
  const offset = dayOfYear % AI_NEWS_TOPICS.length;
  return [...AI_NEWS_TOPICS.slice(offset), ...AI_NEWS_TOPICS.slice(0, offset)];
}

export async function POST(request: NextRequest) {
  try {
    // 驗證 cron secret
    const authHeader = request.headers.get('Authorization');
    const expectedSecret = process.env.CRON_SECRET;
    if (expectedSecret && authHeader !== `Bearer ${expectedSecret}`) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. 清理過期任務
    const now = new Date().toISOString();
    const { error: expireError } = await supabase
      .from('news_tasks')
      .update({ status: 'expired' })
      .eq('status', 'open')
      .lt('due_at', now);

    if (expireError) console.error('Error expiring tasks:', expireError);

    // 2. 釋放超時領取的任務
    const { error: releaseError } = await supabase
      .from('news_tasks')
      .update({
        status: 'open',
        assigned_to: null,
        assigned_at: null,
        lock_expires_at: null,
      })
      .eq('status', 'assigned')
      .lt('lock_expires_at', now);

    if (releaseError) console.error('Error releasing tasks:', releaseError);

    // 3. 檢查是否已有今日任務
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const { count: existingCount } = await supabase
      .from('news_tasks')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', todayStart.toISOString())
      .lte('created_at', todayEnd.toISOString());

    if ((existingCount || 0) >= 10) {
      return NextResponse.json({
        success: true,
        message: `Already created ${existingCount} tasks today`,
        created: 0,
      });
    }

    // 4. 檢查已存在的 source_hash（避免重複）
    const { data: existingHashes } = await supabase
      .from('news_tasks')
      .select('source_hash')
      .not('source_hash', 'is', null);

    const existingHashSet = new Set((existingHashes || []).map(h => h.source_hash));
    const todayStr = new Date().toISOString().slice(0, 10);
    const dueAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h 後過期

    // 5. 生成今日任務（10 個 AI 主題）
    const topics = getShuffledTopics();
    const tasksToCreate: any[] = [];
    const neededCount = 10 - (existingCount || 0);

    for (let i = 0; i < topics.length && tasksToCreate.length < neededCount; i++) {
      const topic = topics[i];
      const hash = `ai_topic_${todayStr}_${topic.category}`;

      if (existingHashSet.has(hash)) {
        console.log(`[create-news-tasks] Skipping duplicate topic: ${topic.category}`);
        continue;
      }

      tasksToCreate.push({
        status: 'open',
        title: topic.title,
        guidance: topic.guidance,
        source_urls: [],      // AI 自行搜尋，不提供 URL
        source_hash: hash,
        created_by: null,     // system created
        due_at: dueAt.toISOString(),
        priority: topic.priority,
        rules: {
          min_word_count: 200,
          max_word_count: 500,
          contains_question: true,
          contains_reflection: true,  // ★ 必須包含反思
          required_sources: 1,
          category: topic.category,
        },
      });
    }

    console.log(`[create-news-tasks] Tasks to create: ${tasksToCreate.length}/${neededCount}`);

    if (tasksToCreate.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No new tasks to create (all topic hashes already exist)',
        created: 0,
        today_total: existingCount || 0,
      });
    }

    const { data: created, error: createError } = await supabase
      .from('news_tasks')
      .insert(tasksToCreate)
      .select();

    if (createError) {
      return NextResponse.json(
        { success: false, error: createError.message },
        { status: 500 }
      );
    }

    // 重新查詢今日創建的任務數量
    const { count: todayCount } = await supabase
      .from('news_tasks')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', todayStart.toISOString())
      .lte('created_at', todayEnd.toISOString());

    return NextResponse.json({
      success: true,
      message: `Created ${tasksToCreate.length} AI-curated news tasks`,
      created: tasksToCreate.length,
      today_total: todayCount || 0,
      topics: tasksToCreate.map(t => t.rules.category),
      expired_cleaned: true,
      released_cleaned: true,
    });

  } catch (error) {
    console.error('Error creating news tasks:', error);
    return NextResponse.json(
      { success: false, error: 'Internal error' },
      { status: 500 }
    );
  }
}

// 也接受 GET 調用（方便手動測試）
export async function GET(request: NextRequest) {
  return POST(request);
}
