import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { withAuth, createErrorResponse, createSuccessResponse } from '@/lib/auth';
import { recordContribution } from '@/lib/contributions';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

/**
 * POST /api/news/submissions/:id/review
 * 管理員審核
 * Body: { decision: "approve" | "request_changes" | "reject", notes?: string }
 * Access: admin
 */
export const POST = withAuth(
  async (req: NextRequest, user: any) => {
    try {
      const submissionId = req.url.split('/submissions/')[1]?.split('/')[0];
      if (!submissionId) {
        return createErrorResponse(400, 'INVALID_SUBMISSION', 'Submission ID required');
      }

      const body = await req.json();
      const { decision, notes } = body;

      if (!['approve', 'request_changes', 'reject'].includes(decision)) {
        return createErrorResponse(400, 'INVALID_DECISION', 'Decision must be approve, request_changes, or reject');
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

      if (submission.status !== 'submitted') {
        return createErrorResponse(409, 'NOT_SUBMITTED', `Submission is ${submission.status}`);
      }

      const now = new Date().toISOString();

      // 更新提交
      const { data: updatedSub, error: updateError } = await supabase
        .from('news_submissions')
        .update({
          status: decision === 'approve' ? 'approved' : decision === 'reject' ? 'rejected' : 'changes_requested',
          reviewed_by: user.id,
          reviewed_at: now,
          review_notes: notes || null,
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
        .update({ status: decision === 'approve' ? 'approved' : decision === 'reject' ? 'rejected' : 'assigned' })
        .eq('id', submission.task_id);

      // approve: 發布為 observation
      let observation = null;
      if (decision === 'approve') {
        const { data: obs, error: obsError } = await supabase
          .from('observations')
          .insert({
            title: submission.observation_title,
            summary: submission.summary,
            content: submission.content,
            question: submission.question,
            source_url: submission.source_urls?.[0] || '',
            author_id: submission.author_id,
            status: 'published',
            published_at: now,
            category: 'news',
          })
          .select()
          .single();

        if (!obsError && obs) {
          observation = obs;
          // 更新 task 的 observation_id
          await supabase
            .from('news_tasks')
            .update({ observation_id: obs.id })
            .eq('id', submission.task_id);

          // 記錄貢獻分
          await recordContribution({
            user_id: submission.author_id,
            action: 'observation.published',
            target_type: 'observation',
            target_id: obs.id,
            metadata: { task_id: submission.task_id, submission_id: submissionId },
          });
        }
      }

      return createSuccessResponse({
        submission: updatedSub,
        observation,
        decision,
        message: decision === 'approve' ? 'Approved and published' : decision === 'reject' ? 'Rejected' : 'Changes requested',
      });

    } catch (error) {
      console.error('Error reviewing submission:', error);
      return createErrorResponse(500, 'INTERNAL_ERROR', 'Unexpected error');
    }
  },
  { requiredRole: 'admin' }
);
