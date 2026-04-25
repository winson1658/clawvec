import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

/**
 * GET /api/cron/auto-review
 * 自動審核送審中的新聞文章
 * - 檢查 submitted 狀態且 review_count < 2 的 submissions
 * - 使用規則引擎自動審核
 * - 審核結果寫入 news_reviews
 */
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;
    if (authHeader !== expectedAuth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 查詢需要審核的 submissions
    const { data: submissions, error } = await supabase
      .from('news_submissions')
      .select('*')
      .eq('status', 'submitted')
      .lt('review_count', 2)
      .order('submitted_at', { ascending: true })
      .limit(10);

    if (error) {
      console.error('Error fetching submissions:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!submissions || submissions.length === 0) {
      return NextResponse.json({ reviewed: 0, message: 'No submissions to review' });
    }

    let reviewedCount = 0;
    const results: any[] = [];

    for (const submission of submissions) {
      // 自動審核逻輯
      const review = await performAutoReview(submission, supabase);
      
      if (review) {
        reviewedCount++;
        results.push({
          submission_id: submission.id,
          verdict: review.verdict,
          score: review.score,
        });
      }
    }

    return NextResponse.json({
      reviewed: reviewedCount,
      total: submissions.length,
      results,
      message: `Reviewed ${reviewedCount}/${submissions.length} submissions`,
    });

  } catch (error) {
    console.error('Error in auto-review:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

/**
 * 自動審核逻輯
 * 評分標準：
 * - 品質檢查 (0-40分)：字數、結構、內容完整度
 * - 準確性檢查 (0-30分)：來源是否有效、來源數量
 * - 原創性檢查 (0-20分)：內容是否為原創
 * - 問題質量 (0-10分)：問題是否有意義
 */
async function performAutoReview(submission: any, supabase: any) {
  const meta = submission.meta || {};
  const rules = submission.task?.rules || {};
  
  let score = 0;
  const checks = {
    quality: false,
    sources: false,
    originality: false,
  };

  // 1. 品質檢查 (0-40分)
  const wordCount = meta.word_count || 0;
  const minWords = rules.min_word_count || 200;
  const maxWords = rules.max_word_count || 500;
  
  if (wordCount >= minWords && wordCount <= maxWords) {
    score += 25;
    // 字數越接近中間值，分數越高
    const targetWords = (minWords + maxWords) / 2;
    const wordScore = Math.max(0, 15 - Math.abs(wordCount - targetWords) / 10);
    score += Math.min(15, wordScore);
    checks.quality = true;
  } else if (wordCount >= minWords * 0.8 && wordCount <= maxWords * 1.2) {
    score += 15;
  } else {
    score += 5;
  }

  // 內容完整度：標題、摘要、內容、問題都有
  if (submission.observation_title && submission.summary && submission.content && submission.question) {
    score += 10;
  }

  // 2. 準確性檢查 (0-30分)
  const sourceUrls = submission.source_urls || [];
  if (sourceUrls.length >= 1) {
    score += 20;
    checks.sources = true;
  }
  if (sourceUrls.length >= 2) {
    score += 10;
  }

  // 3. 原創性檢柤 (0-20分)
  // 簡單检查：內容長度超過100字且不是單純複製粘貼
  const content = submission.content || '';
  if (content.length > 200 && !meta.contains_first_person) {
    score += 15;
    checks.originality = true;
  } else if (content.length > 100) {
    score += 10;
  }

  // 問題質量 (0-10分)
  const question = submission.question || '';
  if (question.length > 10 && question.includes('?')) {
    score += 10;
  }

  // 確定審核結果
  let verdict: 'pass' | 'reject' | 'changes_needed';
  if (score >= 70) {
    verdict = 'pass';
  } else if (score >= 40) {
    verdict = 'changes_needed';
  } else {
    verdict = 'reject';
  }

  // 分數必須為整數，否則 PostgreSQL int 欄位會報錯
  const roundedScore = Math.round(score);

  // 寫入審核記錄
  const { data: review, error: reviewError } = await supabase
    .from('news_reviews')
    .insert({
      submission_id: submission.id,
      reviewer_id: null, // 自動審核，無具體 reviewer
      verdict,
      score: roundedScore,
      feedback: generateFeedback(roundedScore, checks),
      checked_sources: checks.sources,
      checked_quality: checks.quality,
      checked_originality: checks.originality,
    })
    .select()
    .single();

  if (reviewError) {
    console.error('Error saving review:', reviewError);
    return null;
  }

  // 更新 submission 審核狀態
  const newReviewCount = (submission.review_count || 0) + 1;
  
  // 計算新的平均分數
  const { data: existingReviews } = await supabase
    .from('news_reviews')
    .select('score')
    .eq('submission_id', submission.id);
  
  const scores = existingReviews?.map((r: any) => r.score) || [roundedScore];
  const avgScore = Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length);

  await supabase
    .from('news_submissions')
    .update({
      review_count: newReviewCount,
      review_score: avgScore,
      review_status: avgScore >= 70 ? 'approved' : avgScore >= 40 ? 'changes_requested' : 'rejected',
    })
    .eq('id', submission.id);

  return review;
}

function generateFeedback(score: number, checks: any): string {
  const parts: string[] = [];
  
  if (score >= 70) {
    parts.push('Quality meets publication standards.');
  } else if (score >= 40) {
    parts.push('Needs improvements before publication.');
  } else {
    parts.push('Does not meet minimum quality requirements.');
  }
  
  if (!checks.quality) parts.push('Content quality could be improved.');
  if (!checks.sources) parts.push('More reliable sources needed.');
  if (!checks.originality) parts.push('Content appears to lack sufficient originality.');
  
  return parts.join(' ');
}
