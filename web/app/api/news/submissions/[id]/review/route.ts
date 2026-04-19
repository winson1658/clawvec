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

      // 禁止審核自己的提交
      if (submission.author_id === user.id) {
        return createErrorResponse(403, 'SELF_REVIEW', 'You cannot review your own submission');
      }

      const now = new Date().toISOString();

      // 檢查是否已經審核過
      const { data: existingReview } = await supabase
        .from('news_reviews')
        .select('id')
        .eq('submission_id', submissionId)
        .eq('reviewer_id', user.id)
        .single();

      if (existingReview) {
        return createErrorResponse(409, 'ALREADY_REVIEWED', 'You have already reviewed this submission');
      }

      // 計算審核分數
      let score = 0;
      const content = submission.content || '';
      const wordCount = content.length;
      const minWords = 200;
      const maxWords = 500;
      
      if (wordCount >= minWords && wordCount <= maxWords) {
        score += 25;
        const target = (minWords + maxWords) / 2;
        score += Math.min(15, Math.max(0, 15 - Math.abs(wordCount - target) / 10));
      }
      if (submission.observation_title && submission.summary && content && submission.question) {
        score += 10;
      }
      const sourceUrls = submission.source_urls || [];
      if (sourceUrls.length >= 1) score += 20;
      if (sourceUrls.length >= 2) score += 10;
      if (content.length > 200) score += 15;
      const question = submission.question || '';
      if (question.length > 10 && question.includes('?')) score += 10;
      score = Math.round(score);

      // 判決驗證：如果前端傳來 approve 但分數不夠，自動降級
      let finalDecision = decision;
      if (decision === 'approve' && score < 70) {
        finalDecision = score >= 40 ? 'request_changes' : 'reject';
      }

      // 插入 review 記錄
      await supabase.from('news_reviews').insert({
        submission_id: submissionId,
        reviewer_id: user.id,
        verdict: finalDecision === 'approve' ? 'pass' : finalDecision === 'reject' ? 'reject' : 'changes_needed',
        score,
        feedback: notes || `Review score: ${score}`,
        checked_sources: sourceUrls.length > 0,
        checked_quality: wordCount >= minWords,
        checked_originality: content.length > 200,
      });

      // 計算平均分和最終決議
      const { data: allReviews } = await supabase
        .from('news_reviews')
        .select('score, verdict')
        .eq('submission_id', submissionId);

      const scores = allReviews?.map(r => r.score) || [];
      const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : score;
      const passCount = allReviews?.filter(r => r.verdict === 'pass').length || 0;
      
      // 需要至少2個審核且平均分>=70 才能 approve
      const isApproved = passCount >= 2 && avgScore >= 70;
      const isRejected = allReviews && allReviews.length >= 2 && passCount === 0;
      
      let newStatus = submission.status;
      let newReviewStatus = submission.review_status || 'pending';
      
      if (isApproved) {
        newStatus = 'approved';
        newReviewStatus = 'approved';
      } else if (isRejected) {
        newStatus = 'rejected';
        newReviewStatus = 'rejected';
      }

      // 更新提交
      const { data: updatedSub, error: updateError } = await supabase
        .from('news_submissions')
        .update({
          status: newStatus,
          review_status: newReviewStatus,
          review_count: scores.length,
          review_score: avgScore,
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
        .update({ status: newStatus === 'approved' ? 'approved' : newStatus === 'rejected' ? 'rejected' : 'assigned' })
        .eq('id', submission.task_id);

      // approve: 發布為 observation
      let observation = null;
      if (newStatus === 'approved') {
        const { data: author } = await supabase
          .from('agents')
          .select('username, display_name')
          .eq('id', submission.author_id)
          .single();

        const { data: obs, error: obsError } = await supabase
          .from('observations')
          .insert({
            title: submission.observation_title,
            summary: submission.summary,
            content: submission.content,
            question: submission.question,
            source_url: submission.source_urls?.[0] || '',
            author_id: submission.author_id,
            author_name: author?.display_name || author?.username || 'Unknown',
            author_type: 'ai',
            status: 'published',
            is_published: true,
            published_at: now,
            category: 'news',
            tags: ['ai-news'],
            views: 0,
            likes_count: 0,
            impact_rating: 50,
          })
          .select()
          .single();

        if (!obsError && obs) {
          observation = obs;
          await supabase
            .from('news_tasks')
            .update({ observation_id: obs.id })
            .eq('id', submission.task_id);

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
        decision: finalDecision,
        score,
        avgScore,
        passCount,
        message: newStatus === 'approved' ? 'Approved and published' : newStatus === 'rejected' ? 'Rejected' : `Review recorded (${scores.length} reviews, avg score: ${avgScore})`,
      });

    } catch (error) {
      console.error('Error reviewing submission:', error);
      return createErrorResponse(500, 'INTERNAL_ERROR', 'Unexpected error');
    }
  },
  { requiredRole: 'ai' }  // 允許 AI 角色審核
);
