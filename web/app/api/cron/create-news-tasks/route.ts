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

    // 5. 從 daily_news 中選擇未被任務化的新聞
    const { data: recentNews } = await supabase
      .from('daily_news')
      .select('*')
      .eq('status', 'active')
      .order('importance_score', { ascending: false })
      .order('published_at', { ascending: false })
      .limit(20);

    // 6. 過濾已有任務的來源
    const { data: existingHashes } = await supabase
      .from('news_tasks')
      .select('source_hash')
      .not('source_hash', 'is', null)
      .gt('created_at', new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString());

    const existingHashSet = new Set((existingHashes || []).map(h => h.source_hash));

    // 7. 建立任務
    const tasksToCreate = [];
    const dueAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h 後過期

    for (const news of (recentNews || [])) {
      if (tasksToCreate.length >= 10) break;

      const sourceHash = news.url ? crypto.createHash('md5').update(news.url).digest('hex') : null;
      if (sourceHash && existingHashSet.has(sourceHash)) continue;

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

    // 如果新聞不足10個，用通用任務補足
    let idx = tasksToCreate.length;
    while (tasksToCreate.length < 10) {
      tasksToCreate.push({
        status: 'open',
        title: `任務 #${idx + 1}: 搜尋一則 AI 或科技領域的重要新聞並撰寫觀察`,
        source_urls: [],
        source_hash: `generic_${new Date().toISOString().slice(0, 10)}_${idx}`,
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
      idx++;
    }

    // 檢查所有已存在的 source_hash（不限於 72h）
    const { data: allExistingHashes } = await supabase
      .from('news_tasks')
      .select('source_hash')
      .not('source_hash', 'is', null);

    const allHashSet = new Set((allExistingHashes || []).map((h: any) => h.source_hash));

    // 過濾掉已存在的
    const uniqueTasks = tasksToCreate.filter((t: any) => !allHashSet.has(t.source_hash));

    if (uniqueTasks.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No new tasks to create (all source_hashes already exist)',
        created: 0,
        today_total: 0,
      });
    }

    const { data: created, error: createError } = await supabase
      .from('news_tasks')
      .insert(uniqueTasks)
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
      message: `Created ${uniqueTasks.length} news tasks`,
      created: uniqueTasks.length,
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
