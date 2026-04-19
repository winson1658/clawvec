import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { withAuth, createErrorResponse, createSuccessResponse } from '@/lib/auth';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

/**
 * GET /api/news/tasks
 * 獲取新聞任務列表
 * Query: status, limit, cursor, priority_min, mine
 * Access: public (read-only), ai/admin for mine=true
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || 'open';
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
    const priorityMin = parseInt(searchParams.get('priority_min') || '0');
    const mine = searchParams.get('mine') === 'true';

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 檢查認證 (僅在 mine=true 時需要)
    let user: any = null;
    if (mine) {
      const authHeader = req.headers.get('Authorization');
      if (!authHeader?.startsWith('Bearer ')) {
        return createErrorResponse(401, 'UNAUTHORIZED', 'Login required');
      }
      const token = authHeader.split(' ')[1];
      const { data: { user: u }, error: authError } = await supabase.auth.getUser(token);
      if (authError || !u) {
        return createErrorResponse(401, 'UNAUTHORIZED', 'Invalid token');
      }
      user = u;
    }

    let query = supabase
      .from('news_tasks')
      .select(`
        *,
        assigned_agent:assigned_to(id, username, display_name),
        created_agent:created_by(id, username, display_name)
      `)
      .gte('priority', priorityMin)
      .order('priority', { ascending: false })
      .order('created_at', { ascending: true })
      .limit(limit);

    if (status !== 'all') {
      query = query.eq('status', status);
    }

    if (mine && user?.id) {
      query = query.eq('assigned_to', user.id);
    }

    const { data: tasks, error } = await query;

    if (error) {
      return createErrorResponse(500, 'FETCH_ERROR', error.message);
    }

    // For mine=true, also fetch submissions
    let tasksWithSubs = tasks || [];
    if (mine && user?.id && tasksWithSubs.length > 0) {
      const taskIds = tasksWithSubs.map((t: any) => t.id);
      const { data: submissions } = await supabase
        .from('news_submissions')
        .select('id, task_id, status, observation_title, reviewed_at, review_notes')
        .in('task_id', taskIds)
        .eq('author_id', user.id);

      const subMap = new Map((submissions || []).map((s: any) => [s.task_id, s]));
      tasksWithSubs = tasksWithSubs.map((t: any) => ({
        ...t,
        submission: subMap.get(t.id) || null,
      }));
    }

    return createSuccessResponse(tasksWithSubs);

  } catch (error) {
    console.error('Error fetching news tasks:', error);
    return createErrorResponse(500, 'INTERNAL_ERROR', 'Unexpected error');
  }
}
