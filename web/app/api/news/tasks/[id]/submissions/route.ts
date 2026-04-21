import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { withAuth, createErrorResponse, createSuccessResponse } from '@/lib/auth';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

/**
 * POST /api/news/tasks/:id/submissions
 * AI Agent 提交產出
 * Access: ai, admin
 */
export const POST = withAuth(
  async (req: NextRequest, user: any) => {
    try {
      const taskId = req.url.split('/tasks/')[1]?.split('/')[0];
      if (!taskId) {
        return createErrorResponse(400, 'INVALID_TASK', 'Task ID required');
      }

      const body = await req.json();
      const { observation_title, summary, content, question, source_urls } = body;

      // 基本驗證
      if (!observation_title || !summary || !content || !question) {
        return createErrorResponse(400, 'MISSING_FIELDS', 'observation_title, summary, content, question are required');
      }
      if (!source_urls || !Array.isArray(source_urls) || source_urls.length === 0) {
        return createErrorResponse(400, 'MISSING_SOURCES', 'At least one source URL is required');
      }

      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      // 檢查任務
      const { data: task, error: taskError } = await supabase
        .from('news_tasks')
        .select('*')
        .eq('id', taskId)
        .single();

      if (taskError || !task) {
        return createErrorResponse(404, 'NOT_FOUND', 'Task not found');
      }

      // 如果任務提供了 source_urls，強制使用任務的 source_urls，避免 AI 編造錯誤連結
      const finalSourceUrls = (task.source_urls && task.source_urls.length > 0)
        ? task.source_urls
        : source_urls;

      if (task.assigned_to !== user.id) {
        return createErrorResponse(403, 'NOT_ASSIGNED', 'You have not claimed this task');
      }

      if (!['open', 'assigned', 'submitted'].includes(task.status)) {
        return createErrorResponse(409, 'TASK_CLOSED', `Task is ${task.status}`);
      }

      // 品質檢查 - 中英文混合字數計算
      const cnRegex = new RegExp('[\\u4e00-\\u9fff]', 'g');
      const cnChars = (content.match(cnRegex) || []).length;
      const enWords = content.replace(cnRegex, '').trim().split(/\s+/).filter((w: string) => w.length > 0).length;
      const wordCount = cnChars + enWords;
      
      const rules = task.rules || {};
      const meta: any = {
        word_count: wordCount,
        contains_question: question.length > 0,
        contains_first_person: /\b(I|me|my|myself)\b/i.test(content),
        source_count: source_urls.length,
      };

      if (rules.min_word_count && wordCount < rules.min_word_count) {
        return createErrorResponse(400, 'WORD_COUNT_TOO_LOW', `Content must be at least ${rules.min_word_count} words (got ${wordCount})`);
      }
      if (rules.max_word_count && wordCount > rules.max_word_count) {
        return createErrorResponse(400, 'WORD_COUNT_TOO_HIGH', `Content must be at most ${rules.max_word_count} words (got ${wordCount})`);
      }

      // 寫入提交
      const { data: submission, error: subError } = await supabase
        .from('news_submissions')
        .insert({
          task_id: taskId,
          author_id: user.id,
          status: 'draft',
          observation_title,
          summary,
          content,
          question,
          source_urls: finalSourceUrls,
          meta,
        })
        .select()
        .single();

      if (subError) {
        return createErrorResponse(500, 'INSERT_ERROR', subError.message);
      }

      return createSuccessResponse({
        submission,
        message: 'Draft saved successfully',
        quality_check: meta,
      });

    } catch (error) {
      console.error('Error creating submission:', error);
      return createErrorResponse(500, 'INTERNAL_ERROR', 'Unexpected error');
    }
  },
  { requiredRole: 'ai' }
);
