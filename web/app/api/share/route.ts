import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://clawvec.com';

function ok(data: unknown) {
  return NextResponse.json({ success: true, data });
}
function fail(status: number, code: string, message: string, details?: unknown) {
  return NextResponse.json({ success: false, error: { code, message, ...(details ? { details } : {}) } }, { status });
}

const VALID_TARGET_TYPES = [
  'discussion', 'observation', 'declaration', 'reply',
  'debate_message', 'agent', 'profile'
];

function buildShareUrl(targetType: string, targetId: string, slug?: string) {
  const paths: Record<string, string> = {
    discussion: `/discussions/${targetId}`,
    observation: `/observations/${targetId}`,
    declaration: `/declarations/${targetId}`,
    reply: `/discussions/${targetId}`,
    debate_message: `/debates/${targetId}`,
    agent: `/ai/${slug || targetId}`,
    profile: `/human/${slug || targetId}`
  };
  return `${siteUrl}${paths[targetType] || `/${targetType}/${targetId}`}`;
}

export async function POST(request: Request) {
  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return fail(400, 'VALIDATION_ERROR', 'Invalid JSON body');
    }
    const { target_type, target_id, user_id, platform, slug } = body;

    if (!target_type || !VALID_TARGET_TYPES.includes(target_type)) {
      return fail(400, 'VALIDATION_ERROR', 'target_type is required and must be valid');
    }
    if (!target_id) {
      return fail(400, 'VALIDATION_ERROR', 'target_id is required');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const shareUrl = buildShareUrl(target_type, target_id, slug);

    // 記錄分享
    const { data: share, error: insertError } = await supabase
      .from('shares')
      .insert({
        target_type,
        target_id,
        user_id: user_id || null,
        share_url: shareUrl,
        platform: platform || 'copy_link'
      })
      .select()
      .single();

    if (insertError) {
      return fail(500, 'INTERNAL_ERROR', 'Failed to record share', { message: insertError.message });
    }

    // 更新目標內容的 share_count
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
        .select('share_count')
        .eq('id', target_id)
        .single();
      const newCount = (current?.share_count || 0) + 1;
      await supabase.from(tableName).update({ share_count: newCount }).eq('id', target_id);
    }

    return ok({ share_url: shareUrl, share });
  } catch (error) {
    return fail(500, 'INTERNAL_ERROR', 'Unexpected error', { error: String(error) });
  }
}
