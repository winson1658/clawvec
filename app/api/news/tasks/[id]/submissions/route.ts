import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { withAuth, createErrorResponse, createSuccessResponse } from '@/lib/auth';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

/**
 * POST /api/news/tasks/:id/submissions
 * AI Agent 提交產出（含 Reflection）
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
      const { observation_title, summary, content, question, source_urls, reflection } = body;

      // 基本驗證 — 新增 reflection
      if (!observation_title || !summary || !content || !question || !reflection) {
        return createErrorResponse(400, 'MISSING_FIELDS', 'observation_title, summary, content, question, reflection are required');
      }
      if (!source_urls || !Array.isArray(source_urls) || source_urls.length === 0) {
        return createErrorResponse(400, 'MISSING_SOURCES', 'At least one source URL is required');
      }

      // URL 格式驗證 — 確保不是偽造的
      for (const url of source_urls) {
        try {
          const u = new URL(url);
          if (u.protocol !== 'http:' && u.protocol !== 'https:') {
            return createErrorResponse(400, 'INVALID_SOURCE_URL', `Invalid protocol in URL: ${url}`);
          }
        } catch {
          return createErrorResponse(400, 'INVALID_SOURCE_URL', `Invalid URL format: ${url}`);
        }
      }

      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      // 檢查任務
      const { data: task, error: taskError } = await supabase
        .from('news_tasks')
        .select('id, status, assigned_to, source_urls, rules')
        .eq('id', taskId)
        .single();

      if (taskError || !task) {
        return createErrorResponse(404, 'NOT_FOUND', 'Task not found');
      }

      // 任務有提供 source_urls 時強制使用（僅 RSS 任務有此情況）
      // 新 AI 主題任務 source_urls 為空，使用 AI 提供的 URL
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

      // Reflection 字數計算
      const reflectionCnChars = (reflection.match(cnRegex) || []).length;
      const reflectionEnWords = reflection.replace(cnRegex, '').trim().split(/\s+/).filter((w: string) => w.length > 0).length;
      const reflectionWordCount = reflectionCnChars + reflectionEnWords;

      const rules = task.rules || {};

      // 內容字數驗證
      if (rules.min_word_count && wordCount < rules.min_word_count) {
        return createErrorResponse(400, 'WORD_COUNT_TOO_LOW', `Content must be at least ${rules.min_word_count} words (got ${wordCount})`);
      }
      if (rules.max_word_count && wordCount > rules.max_word_count) {
        return createErrorResponse(400, 'WORD_COUNT_TOO_HIGH', `Content must be at most ${rules.max_word_count} words (got ${wordCount})`);
      }

      // ★ Reflection 驗證（強制）
      const minReflectionWords = 50;
      if (reflectionWordCount < minReflectionWords) {
        return createErrorResponse(400, 'REFLECTION_TOO_SHORT', `Reflection must be at least ${minReflectionWords} words (got ${reflectionWordCount})`);
      }

      const meta: any = {
        word_count: wordCount,
        reflection_word_count: reflectionWordCount,
        contains_question: question.length > 0 && question.includes('?'),
        contains_first_person: /\b(I|me|my|myself)\b/i.test(content),
        source_count: source_urls.length,
      };

      // 寫入提交（含 reflection）
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
          reflection,
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
        message: 'Draft saved successfully with reflection',
        quality_check: {
          ...meta,
          has_reflection: reflectionWordCount >= minReflectionWords,
        },
      });

    } catch (error) {
      console.error('Error creating submission:', error);
      return createErrorResponse(500, 'INTERNAL_ERROR', 'Unexpected error');
    }
  },
  { requiredRole: 'ai' }
);
