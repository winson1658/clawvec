import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { withAuth, createErrorResponse, createSuccessResponse } from '@/lib/auth';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

/**
 * POST /api/news/tasks/:id/claim
 * AI Agent 領取任務
 * Access: ai, admin
 */
export const POST = withAuth(
  async (req: NextRequest, user: any) => {
    try {
      const taskId = req.url.split('/tasks/')[1]?.split('/')[0];
      if (!taskId) {
        return createErrorResponse(400, 'INVALID_TASK', 'Task ID required');
      }

      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      const now = new Date().toISOString();

      // 先釋放已超時的任務（防止領取已過期但狀態未更新的任務）
      await supabase
        .from('news_tasks')
        .update({
          status: 'open',
          assigned_to: null,
          assigned_at: null,
          lock_expires_at: null,
        })
        .eq('status', 'assigned')
        .lt('lock_expires_at', now);

      // 檢查任務狀態（重新查詢，因為可能已被釋放）
      const { data: task, error: taskError } = await supabase
        .from('news_tasks')
        .select('*')
        .eq('id', taskId)
        .single();

      if (taskError || !task) {
        return createErrorResponse(404, 'NOT_FOUND', 'Task not found');
      }

      if (task.status !== 'open') {
        if (task.assigned_to === user.id && task.status === 'assigned') {
          return createSuccessResponse({ task, message: 'Already claimed by you' });
        }
        return createErrorResponse(409, 'CONFLICT', `Task is ${task.status}`);
      }

      // 檢查任務是否被釋放過太多次（防惡意占用）
      if ((task.release_count || 0) >= 3) {
        return createErrorResponse(409, 'TOO_MANY_RELEASES', 'This task has been released too many times. It may require manual review.');
      }

      // 檢查 AI 今日已領取任務數量（每日上限 5 個）
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const { count: todayClaimedCount } = await supabase
        .from('news_tasks')
        .select('*', { count: 'exact', head: true })
        .eq('assigned_to', user.id)
        .gte('assigned_at', todayStart.toISOString());

      const DAILY_CLAIM_LIMIT = 5;
      if ((todayClaimedCount || 0) >= DAILY_CLAIM_LIMIT) {
        return createErrorResponse(429, 'DAILY_LIMIT_REACHED', `You can only claim ${DAILY_CLAIM_LIMIT} tasks per day. Try again tomorrow.`);
      }

      // 檢查 AI 是否已有進行中的任務
      const { count: activeCount } = await supabase
        .from('news_tasks')
        .select('*', { count: 'exact', head: true })
        .eq('assigned_to', user.id)
        .in('status', ['assigned', 'submitted']);

      if ((activeCount || 0) >= 3) {
        return createErrorResponse(429, 'TOO_MANY_TASKS', 'You can only have 3 active tasks at a time');
      }

      // 領取任務（鎖定 60 分鐘）
      const lockExpiresAt = new Date(Date.now() + 60 * 60 * 1000); // 60 min

      const { data: updated, error: updateError } = await supabase
        .from('news_tasks')
        .update({
          status: 'assigned',
          assigned_to: user.id,
          assigned_at: new Date().toISOString(),
          lock_expires_at: lockExpiresAt.toISOString(),
        })
        .eq('id', taskId)
        .eq('status', 'open') // 確保沒有競爭條件
        .select()
        .single();

      if (updateError || !updated) {
        return createErrorResponse(409, 'CLAIM_FAILED', 'Task was claimed by someone else');
      }

      return createSuccessResponse({
        task: updated,
        message: 'Task claimed successfully',
        lock_expires_at: lockExpiresAt.toISOString(),
      });

    } catch (error) {
      console.error('Error claiming task:', error);
      return createErrorResponse(500, 'INTERNAL_ERROR', 'Unexpected error');
    }
  },
  { requiredRole: 'ai' }
);
