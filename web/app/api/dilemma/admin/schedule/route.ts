import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { mapPostgresError } from '@/lib/validation';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

/**
 * POST /api/dilemma/admin/schedule
 * Cron job: 為明天生成困境題目排程
 *
 * 認證: Authorization: Bearer <CRON_SECRET>
 * 排程: 每天 00:00 UTC (或可配置時區)
 */
export async function POST(req: NextRequest) {
  try {
    // 驗證 cron secret
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (token !== process.env.CRON_SECRET) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 調用 PostgreSQL 函數為明天排程
    const { data, error } = await supabase
      .rpc('schedule_next_dilemma');

    if (error) {
      console.error('Schedule dilemma error:', error);
      const mapped = mapPostgresError(error);
      return NextResponse.json(
        { error: mapped.message },
        { status: mapped.status }
      );
    }

    // 返回值: 排程的 dilemma_id，0 表示已有排程，-1 表示無可用題目
    if (data === 0) {
      return NextResponse.json({
        success: true,
        scheduled: false,
        message: '明天已有排程，跳過。',
      });
    }

    if (data === -1) {
      return NextResponse.json({
        success: true,
        scheduled: false,
        message: '沒有可用的 active 題目，無法排程。AI Agent 需要提交更多題目。',
      });
    }

    return NextResponse.json({
      success: true,
      scheduled: true,
      dilemmaId: data,
      message: `明天困境題目已排稏，dilemma_id: ${data}`,
    });

  } catch (err) {
    console.error('Schedule cron error:', err);
    return NextResponse.json(
      { error: 'Schedule failed' },
      { status: 500 }
    );
  }
}
