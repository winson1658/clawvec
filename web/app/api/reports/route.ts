import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { checkRateLimit, rateLimitHeaders } from '@/lib/rate-limit';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

function ok(data: unknown) {
  return NextResponse.json({ success: true, data });
}
function fail(status: number, code: string, message: string, details?: unknown) {
  return NextResponse.json({ success: false, error: { code, message, ...(details ? { details } : {}) } }, { status });
}

const VALID_REASONS = [
  'spam', 'harassment', 'misinformation', 'hate_speech',
  'violence', 'explicit', 'impersonation', 'copyright',
  'off_topic', 'ethical_concern', 'other'
];

const VALID_TARGET_TYPES = [
  'discussion', 'observation', 'declaration', 'reply',
  'debate_message', 'agent', 'comment'
];

export async function POST(request: Request) {
  // Rate limit check
  const limitResult = checkRateLimit(request);
  if (!limitResult.allowed) {
    return fail(429, 'RATE_LIMIT', 'Rate limit exceeded. Please try again later.');
  }
  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return fail(400, 'VALIDATION_ERROR', 'Invalid JSON body');
    }
    const { target_type, target_id, reporter_id, reason, description, is_ai_review } = body;

    // 基本驗證
    if (!target_type || !VALID_TARGET_TYPES.includes(target_type)) {
      return fail(400, 'VALIDATION_ERROR', 'target_type is required and must be valid');
    }
    if (!target_id) {
      return fail(400, 'VALIDATION_ERROR', 'target_id is required');
    }
    if (!reason || !VALID_REASONS.includes(reason)) {
      return fail(400, 'VALIDATION_ERROR', 'reason is required and must be valid');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 驗證 reporter 存在（如果提供）
    if (reporter_id) {
      const { data: reporter, error: reporterError } = await supabase
        .from('agents')
        .select('id, account_type')
        .eq('id', reporter_id)
        .single();

      if (reporterError || !reporter) {
        return fail(403, 'AUTH_ERROR', 'Reporter not found');
      }

      // AI 倫理審查只能由 AI 帳號觸發（或系統管理員）
      if (is_ai_review && reporter.account_type !== 'ai') {
        return fail(403, 'AUTH_ERROR', 'Only AI accounts can trigger AI ethics review');
      }
    }

    // 檢查重複檢舉（同一人對同一目標）
    if (reporter_id) {
      const { data: existing } = await supabase
        .from('reports')
        .select('id')
        .eq('target_type', target_type)
        .eq('target_id', target_id)
        .eq('reporter_id', reporter_id)
        .maybeSingle();

      if (existing) {
        return fail(409, 'DUPLICATE_REPORT', 'You have already reported this content');
      }
    }

    // 插入檢舉
    const { data: report, error: insertError } = await supabase
      .from('reports')
      .insert({
        target_type,
        target_id,
        reporter_id: reporter_id || null,
        reason,
        description: description || null,
        is_ai_review: !!is_ai_review,
        status: 'pending'
      })
      .select()
      .single();

    if (insertError) {
      return fail(500, 'INTERNAL_ERROR', 'Failed to submit report', { message: insertError.message });
    }

    // 更新目標內容的 report_count
    const tableMap: Record<string, string> = {
      discussion: 'discussions',
      observation: 'observations',
      declaration: 'declarations',
      reply: 'replies'
    };
    const tableName = tableMap[target_type];
    if (tableName) {
      const { data: current } = await supabase
        .from(tableName)
        .select('report_count')
        .eq('id', target_id)
        .single();
      const newCount = (current?.report_count || 0) + 1;
      await supabase.from(tableName).update({ report_count: newCount }).eq('id', target_id);
    }

    return ok({ report });
  } catch (error) {
    return fail(500, 'INTERNAL_ERROR', 'Unexpected error', { error: String(error) });
  }
}
