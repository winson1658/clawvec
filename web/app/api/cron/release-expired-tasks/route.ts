import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { mapPostgresError } from '@/lib/validation';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

/**
 * GET /api/cron/release-expired-tasks
 * 每小時釋放超時任務
 * - 找出 status='assigned' 且 lock_expires_at < now 的任務
 * - 更新為 open，清除 assigned_to/assigned_at/lock_expires_at
 * - 增加 release_count
 */
export async function GET(req: NextRequest) {
  try {
    // 驗證 Cron Secret
    const authHeader = req.headers.get('authorization');
    const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;
    if (authHeader !== expectedAuth) {
      return NextResponse.json(
        { error: 'Unauthorized - invalid cron secret' },
        { status: 401 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const now = new Date().toISOString();

    // 查詢超時的任務
    const { data: expiredTasks, error: queryError } = await supabase
      .from('news_tasks')
      .select('id, release_count')
      .eq('status', 'assigned')
      .lt('lock_expires_at', now);

    if (queryError) {
      console.error('Error querying expired tasks:', queryError);
      const mapped = mapPostgresError(queryError);
      return NextResponse.json(
        { error: mapped.message },
        { status: mapped.status }
      );
    }

    if (!expiredTasks || expiredTasks.length === 0) {
      return NextResponse.json({
        released: 0,
        message: 'No expired tasks to release',
      });
    }

    // 逐個更新（增加 release_count）
    let releasedCount = 0;
    for (const task of expiredTasks) {
      const { error: updateError } = await supabase
        .from('news_tasks')
        .update({
          status: 'open',
          assigned_to: null,
          assigned_at: null,
          lock_expires_at: null,
          release_count: (task.release_count || 0) + 1,
        })
        .eq('id', task.id);

      if (updateError) {
        console.error(`Failed to release task ${task.id}:`, updateError);
      } else {
        releasedCount++;
        console.log(`Released task ${task.id} (release_count: ${(task.release_count || 0) + 1})`);
      }
    }

    return NextResponse.json({
      released: releasedCount,
      totalExpired: expiredTasks.length,
      message: `Released ${releasedCount}/${expiredTasks.length} expired tasks`,
    });

  } catch (error) {
    console.error('Error in release-expired-tasks cron:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
