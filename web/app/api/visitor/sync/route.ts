import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

function ok(data: unknown) {
  return NextResponse.json({ success: true, data });
}

function fail(status: number, code: string, message: string, details?: unknown) {
  return NextResponse.json({ success: false, error: { code, message, ...(details ? { details } : {}) } }, { status });
}

/**
 * POST /api/visitor/sync
 * 同步訪客行為到登入用戶
 * Access: authed (通常是在登入/註冊後呼叫)
 * Action: visitor.sync
 * Idempotency: idempotent (以 fingerprint 去重)
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { visitor_token, user_id, mode = 'merge', actions = [] } = body;

    // 驗證
    if (!visitor_token || !user_id) {
      return fail(400, 'VALIDATION_ERROR', 'visitor_token and user_id are required');
    }

    if (!Array.isArray(actions) || actions.length === 0) {
      return ok({ synced: 0, skipped_duplicates: 0, upgraded: {} });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 驗證 user_id 存在
    const { data: user, error: userError } = await supabase
      .from('agents')
      .select('id')
      .eq('id', user_id)
      .single();

    if (userError || !user) {
      return fail(404, 'NOT_FOUND', 'User not found');
    }

    // 檢查此 visitor_token + user_id 組合是否已同步過
    const { data: existingSync } = await supabase
      .from('visitor_syncs')
      .select('id')
      .eq('visitor_token', visitor_token)
      .eq('user_id', user_id)
      .maybeSingle();

    // 去重：單次請求內的 actions
    const seenFingerprints = new Set<string>();
    const uniqueActions = actions.filter((action: any) => {
      const fingerprint = generateFingerprint(visitor_token, user_id, action);
      if (seenFingerprints.has(fingerprint)) return false;
      seenFingerprints.add(fingerprint);
      return true;
    });

    let synced = 0;
    let skippedDuplicates = 0;
    const upgraded: Record<string, number> = {};

    for (const action of uniqueActions) {
      const fingerprint = generateFingerprint(visitor_token, user_id, action);

      // 檢查是否已存在
      const { data: existing } = await supabase
        .from('visitor_actions')
        .select('id')
        .eq('sync_fingerprint', fingerprint)
        .maybeSingle();

      if (existing) {
        skippedDuplicates++;
        continue;
      }

      // 寫入 visitor_actions
      const { error: insertError } = await supabase
        .from('visitor_actions')
        .insert({
          visitor_token,
          user_id,
          action_type: action.action_type,
          target_type: action.target_type,
          target_id: action.target_id,
          payload: action.payload || {},
          occurred_at: action.occurred_at || new Date().toISOString(),
          sync_fingerprint: fingerprint,
          synced_at: new Date().toISOString(),
        });

      if (insertError) {
        console.error('Failed to insert visitor action:', insertError);
        continue;
      }

      synced++;

      // 處理可升級的內容
      await handleUpgradableContent(supabase, action, user_id, upgraded);
    }

    // 記錄此次同步
    if (!existingSync) {
      await supabase.from('visitor_syncs').insert({
        visitor_token,
        user_id,
        synced_at: new Date().toISOString(),
        actions_count: synced,
      });
    }

    return ok({
      synced,
      skipped_duplicates: skippedDuplicates,
      upgraded,
      total_actions: actions.length,
      unique_actions: uniqueActions.length,
    });

  } catch (error) {
    return fail(500, 'INTERNAL_ERROR', 'Unexpected error', { error: String(error) });
  }
}

// 生成 fingerprint 用於去重
function generateFingerprint(visitorToken: string, userId: string, action: any): string {
  const key = [
    visitorToken,
    userId,
    action.action_type,
    action.target_type || '',
    action.target_id || '',
    action.occurred_at || '',
  ].join('|');
  
  // 簡單的 hash
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    const char = key.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return `fp_${Math.abs(hash).toString(16)}`;
}

// 處理可升級的內容
async function handleUpgradableContent(
  supabase: any,
  action: any,
  userId: string,
  upgraded: Record<string, number>
) {
  const { action_type, payload } = action;

  // 草稿升級
  if (action_type === 'declaration.draft_saved' && payload?.draft) {
    const { error } = await supabase
      .from('declarations')
      .insert({
        title: payload.draft.title,
        content: payload.draft.content,
        author_id: userId,
        status: 'draft',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

    if (!error) {
      upgraded.drafts = (upgraded.drafts || 0) + 1;
    }
  }

  // 立場同步（僅作為展示用，不計入正式結果）
  if (action_type === 'debate.side_voted') {
    // 記錄但不影響正式結果
    upgraded.stance_preferences = (upgraded.stance_preferences || 0) + 1;
  }

  // 其他可升級項目...
}
