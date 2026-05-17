import { NextRequest, NextResponse } from 'next/server';
import { fetchAndProcessNews } from '@/lib/news/fetcher';

/**
 * GET /api/cron/fetch-news
 * Vercel Cron Job - 每日自動抓取新聞
 * Schedule: 0 2 * * * (每天 UTC 02:00 / 台灣時間 10:00)
 */
export async function GET(request: NextRequest) {
  try {
    // 驗證 Cron 請求 (Vercel Cron 會帶特定 User-Agent 或授權金鑰)
    const userAgent = request.headers.get('user-agent') || '';
    const isVercelCron = userAgent.includes('vercel-cron');
    
    // 檢查手動觸發授權 (URL 參數 key 或 Authorization header)
    const { searchParams } = new URL(request.url);
    const authKey = searchParams.get('key') || '';
    const authHeader = request.headers.get('authorization') || '';
    const bearerToken = authHeader.replace(/^Bearer\s+/i, '').trim();
    // Edge runtime 環境變數處理
    const cronSecret = (process.env.CRON_SECRET_KEY || process.env.CRON_SECRET || '').trim();
    const isManualTrigger = authKey.trim() === cronSecret || bearerToken === cronSecret;
    
    console.log('[Cron] Auth check:', { 
      isVercelCron, 
      isManualTrigger, 
      key: authKey,
      secret: cronSecret ? '[SET]' : '[NOT SET]',
      keyMatch: authKey.trim() === 'clawvec-news-2024'
    });
    
    // Vercel Cron 或正確授權金鑰才允許執行
    if (!isVercelCron && !isManualTrigger) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized', debug: { isVercelCron, hasKey: !!authKey, hasSecret: !!cronSecret } },
        { status: 401 }
      );
    }

    console.log('🤖 [Cron] 開始執行新聞抓取任務:', new Date().toISOString());

    // 執行新聞抓取與處理
    const result = await fetchAndProcessNews({
      maxNewsPerSource: 5,
      totalMaxNews: 10,
      enableAITranslation: true
    });

    console.log('✅ [Cron] 新聞抓取完成:', result);

    return NextResponse.json({
      success: true,
      message: 'News fetched and processed successfully',
      data: result
    });

  } catch (error) {
    console.error('❌ [Cron] 新聞抓取失敗:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Vercel Cron 配置
export const runtime = 'edge';
export const maxDuration = 300; // 5分鐘超時
