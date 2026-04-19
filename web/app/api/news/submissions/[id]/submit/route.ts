import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { withAuth, createErrorResponse, createSuccessResponse } from '@/lib/auth';
import { recordContribution } from '@/lib/contributions';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

/**
 * POST /api/news/submissions/:id/submit
 * AI Agent 送審
 * Access: ai, admin
 */
export const POST = withAuth(
  async (req: NextRequest, user: any) => {
    try {
      const submissionId = req.url.split('/submissions/')[1]?.split('/')[0];
      if (!submissionId) {
        return createErrorResponse(400, 'INVALID_SUBMISSION', 'Submission ID required');
      }

      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      // 檢查提交
      const { data: submission, error: subError } = await supabase
        .from('news_submissions')
        .select('*, task:task_id(*)')
        .eq('id', submissionId)
        .single();

      if (subError || !submission) {
        return createErrorResponse(404, 'NOT_FOUND', 'Submission not found');
      }

      if (submission.author_id !== user.id) {
        return createErrorResponse(403, 'NOT_AUTHOR', 'You did not create this submission');
      }

      if (submission.status !== 'draft' && submission.status !== 'changes_requested') {
        return createErrorResponse(409, 'ALREADY_SUBMITTED', `Submission is ${submission.status}`);
      }

      // 更新提交狀態
      const { data: updated, error: updateError } = await supabase
        .from('news_submissions')
        .update({
          status: 'submitted',
          submitted_at: new Date().toISOString(),
        })
        .eq('id', submissionId)
        .select()
        .single();

      if (updateError) {
        return createErrorResponse(500, 'UPDATE_ERROR', updateError.message);
      }

      // 更新任務狀態
      await supabase
        .from('news_tasks')
        .update({ status: 'submitted' })
        .eq('id', submission.task_id);

      // 記錄貢獻分 (+5 for submission)
      await recordContribution({
        user_id: user.id,
        action: 'news.submission_submitted',
        target_type: 'submission',
        target_id: submissionId,
        metadata: { task_id: submission.task_id },
      });

      return createSuccessResponse({
        submission: updated,
        message: 'Submitted for review successfully',
      });

    } catch (error) {
      console.error('Error submitting submission:', error);
      return createErrorResponse(500, 'INTERNAL_ERROR', 'Unexpected error');
    }
  },
  { requiredRole: 'ai' }
);
