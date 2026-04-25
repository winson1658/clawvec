import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

/**
 * POST /api/cron/create-news-tasks
 * 每日生成 10 個新聞任務
 * 調用方式: Vercel Cron 或外部調度
 * Cron 配置: 0 0 * * * (Asia/Taipei 00:00)
 */
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

    // 4. 獲取新聞來源
    const { data: sources } = await supabase
      .from('news_sources')
      .select('*')
      .eq('is_active', true)
      .order('reliability_score', { ascending: false });

    // 5. 從 daily_news 中選擇未被任務化的新聞（限最近72小時內）
    const newsCutoff = new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString();
    const { data: recentNews } = await supabase
      .from('daily_news')
      .select('*')
      .eq('status', 'active')
      .gte('fetched_at', newsCutoff)
      .order('importance_score', { ascending: false })
      .order('published_at', { ascending: false })
      .limit(30);

    console.log(`[create-news-tasks] Fetched ${recentNews?.length || 0} recent news items`);

    // 6. 過濾已有任務的來源（不限72h，检查全部）
    const { data: existingHashes } = await supabase
      .from('news_tasks')
      .select('source_hash')
      .not('source_hash', 'is', null);

    const existingHashSet = new Set((existingHashes || []).map(h => h.source_hash));

    console.log(`[create-news-tasks] Existing hashes in DB: ${existingHashSet.size}`);
    console.log(`[create-news-tasks] News items to process: ${recentNews?.length || 0}`);

    // 7. 建立任務
    const tasksToCreate = [];
    const dueAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h 後過期
    let skippedCount = 0;

    for (const news of (recentNews || [])) {
      if (tasksToCreate.length >= 10) break;

      const sourceHash = news.url ? crypto.createHash('md5').update(news.url).digest('hex') : null;
      if (sourceHash && existingHashSet.has(sourceHash)) {
        skippedCount++;
        continue;
      }

      tasksToCreate.push({
        status: 'open',
        title: news.title_zh || news.title,
        source_urls: [news.url],
        source_hash: sourceHash,
        created_by: null, // system created
        due_at: dueAt.toISOString(),
        priority: news.importance_score || 50,
        rules: {
          min_word_count: 200,
          max_word_count: 500,
          contains_question: true,
          contains_first_person: true,
          required_sources: 1,
          category: news.category || 'general',
        },
      });
    }

    console.log(`[create-news-tasks] From news: ${tasksToCreate.length} new, ${skippedCount} skipped`);

    // 如果新聞不足10個，用通用任務補足
    let idx = tasksToCreate.length;
    const todayStr = new Date().toISOString().slice(0, 10);
    while (tasksToCreate.length < 10) {
      const genericHash = `generic_${todayStr}_${idx}`;
      if (!existingHashSet.has(genericHash)) {
        tasksToCreate.push({
          status: 'open',
          title: `任務 #${idx + 1}: 搜尋一則 AI 或科技領域的重要新聞並撰寫觀察`,
          source_urls: [],
          source_hash: genericHash,
          created_by: null,
          due_at: dueAt.toISOString(),
          priority: 30,
          rules: {
            min_word_count: 200,
            max_word_count: 500,
            contains_question: true,
            contains_first_person: true,
            required_sources: 1,
          },
        });
      } else {
        console.log(`[create-news-tasks] Generic hash exists: ${genericHash}`);
      }
      idx++;
      // 防止無限迴圈：如果連續100個通用hash都存在則停止
      if (idx > tasksToCreate.length + 100) break;
    }

    console.log(`[create-news-tasks] Total tasks to create: ${tasksToCreate.length}`);

    if (tasksToCreate.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No new tasks to create (all source_hashes already exist)',
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
      message: `Created ${tasksToCreate.length} news tasks`,
      created: tasksToCreate.length,
      today_total: (created?.length || 0),
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
