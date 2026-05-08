import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

/**
 * GET /api/cron/auto-review
 * 自動審核送審中的新聞文章（含 Reflection 評分）
 */
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;
    if (authHeader !== expectedAuth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 查詢需要審核的 submissions（含任務關聯）
    const { data: submissions, error } = await supabase
      .from('news_submissions')
      .select('*, task:task_id(rules, source_urls)')
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
      const review = await performAutoReview(submission, supabase);
      if (review) {
        reviewedCount++;
        results.push({
          submission_id: submission.id,
          verdict: review.verdict,
          score: review.score,
          reflection_score: review.reflection_score,
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
 * 自動審核邏輯（含 Reflection 評分）
 * 評分標準：
 * - 品質檢查 (0-30分)：字數、結構、內容完整度
 * - Reflection 品質 (0-20分)：反思內容長度與品質
 * - 來源檢查 (0-20分)：來源數量
 * - 原創性 (0-10分)
 * - 問題品質 (0-10分)
 * - 完整性 (0-10分)
 * 通過門檻：有 reflection 需求者 75 分，其他 70 分
 */
async function performAutoReview(submission: any, supabase: any) {
  const meta = submission.meta || {};
  const taskRules = submission.task?.rules || {};
  const content = submission.content || '';
  const reflection = submission.reflection || '';

  let score = 0;
  const checks: Record<string, boolean> = {
    quality: false,
    sources: false,
    originality: false,
    has_reflection: false,
  };

  // 1. 品質檢查 (0-40分)
  const wordCount = meta.word_count || content.length || 0;
  const minWords = taskRules.min_word_count || 200;
  const maxWords = taskRules.max_word_count || 500;

  if (wordCount >= minWords && wordCount <= maxWords) {
    score += 25;
    const targetWords = (minWords + maxWords) / 2;
    const wordScore = Math.max(0, 15 - Math.abs(wordCount - targetWords) / 10);
    score += Math.min(15, wordScore);
    checks.quality = true;
  } else if (wordCount >= minWords * 0.8 && wordCount <= maxWords * 1.2) {
    score += 15;
  } else {
    score += 5;
  }

  // 內容完整性
  if (submission.observation_title && submission.summary && content && submission.question) {
    score += 10;
  }

  // 2. ★ Reflection 品質檢查 (0-20分)
  const reflectionWordCount = meta.reflection_word_count || reflection.length || 0;
  const needsReflection = taskRules.contains_reflection === true;

  if (reflectionWordCount >= 50) {
    score += 15;
    checks.has_reflection = true;
    if (reflectionWordCount >= 100) {
      score += 5; // 長反思加分
    }
  } else if (needsReflection && reflectionWordCount > 0) {
    score += 5; // 有提供但不足
  }

  // 3. 來源檢查 (0-20分)
  const sourceUrls = submission.source_urls || [];
  if (sourceUrls.length >= 1) {
    score += 15;
    checks.sources = true;
  }
  if (sourceUrls.length >= 2) {
    score += 5;
  }

  // 4. 原創性 (0-10分)
  if (content.length > 200 && !meta.contains_first_person) {
    score += 10;
    checks.originality = true;
  } else if (content.length > 100) {
    score += 5;
  }

  // 5. 問題品質 (0-10分)
  const question = submission.question || '';
  if (question.length > 10 && question.includes('?')) {
    score += 10;
  }

  // 確定通過門檻
  const passThreshold = needsReflection ? 75 : 70;
  let verdict: 'pass' | 'reject' | 'changes_needed';
  if (score >= passThreshold) {
    verdict = 'pass';
  } else if (score >= 40) {
    verdict = 'changes_needed';
  } else {
    verdict = 'reject';
  }

  const roundedScore = Math.round(score);

  // 寫入審核記錄
  const { data: review, error: reviewError } = await supabase
    .from('news_reviews')
    .insert({
      submission_id: submission.id,
      reviewer_id: null,
      verdict,
      score: roundedScore,
      feedback: generateFeedback(roundedScore, checks, needsReflection),
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
      review_status: avgScore >= passThreshold ? 'approved' : avgScore >= 40 ? 'changes_requested' : 'rejected',
    })
    .eq('id', submission.id);

  return { ...review, reflection_score: checks.has_reflection };
}

function generateFeedback(score: number, checks: Record<string, boolean>, needsReflection: boolean): string {
  const parts: string[] = [];

  if (score >= 75) {
    parts.push('Quality exceeds publication standards.');
  } else if (score >= 70) {
    parts.push('Quality meets publication standards.');
  } else if (score >= 40) {
    parts.push('Needs improvements before publication.');
  } else {
    parts.push('Does not meet minimum quality requirements.');
  }

  if (!checks.quality) parts.push('Content quality could be improved (check word count).');
  if (!checks.sources) parts.push('More reliable sources needed.');
  if (!checks.originality) parts.push('Content appears to lack sufficient originality.');
  if (needsReflection && !checks.has_reflection) parts.push('Reflection section is missing or too short (min 50 words).');

  return parts.join(' ');
}
