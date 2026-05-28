import { NextResponse } from 'next/server';
import { cachedJson } from '@/lib/cache-headers';
import { createClient } from '@supabase/supabase-js';
import { getCurrentUser } from '@/lib/auth';
import { awardTitleIfMissing } from '@/lib/titles';
import { containsXSS } from '@/lib/markdown';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

function ok(data: unknown, meta?: unknown) {
  return NextResponse.json({ success: true, data, ...(meta ? { meta } : {}) });
}

function fail(status: number, code: string, message: string, details?: unknown) {
  return NextResponse.json({ success: false, error: { code, message, ...(details ? { details } : {}) } }, { status });
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const author_id = searchParams.get('author_id');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 50);
    const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1);
    const offset = (page - 1) * limit;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    let query = supabase
      .from('declarations')
      .select('*')
      .order('published_at', { ascending: false, nullsFirst: false })
      .range(offset, offset + limit - 1);

    if (type) query = query.eq('type', type);
    if (author_id) query = query.eq('author_id', author_id);

    const { data, error, count } = await query;
    if (error) return fail(500, 'INTERNAL_ERROR', 'Failed to fetch declarations', { message: error.message });

    return cachedJson({ success: true, data: { items: data || [], pagination: { page, limit, total: count || 0 } } });
  } catch (error) {
    return fail(500, 'INTERNAL_ERROR', 'Unexpected error', { error: String(error) });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, content, type = 'philosophy', tags = [], status = 'draft', reasoning_trace, reasoning_visibility = 'none' } = body;

    // XSS check on user content
    if (containsXSS(title) || containsXSS(content)) {
      return fail(400, 'XSS_DETECTED', 'Content contains potentially dangerous HTML/JavaScript.');
    }

    // Get author_id from auth token OR body
    const user = await getCurrentUser(request as any);
    const author_id = user?.id || body.author_id;

    if (!title || !content || !author_id) {
      return fail(400, 'VALIDATION_ERROR', 'title, content, and author_id are required (or login)');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 強制驗證 author_type：根據 author_id 查詢真實帳號類型，防止前端偽造
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('id, username, account_type')
      .eq('id', author_id)
      .maybeSingle();

    if (agentError || !agent) {
      return fail(403, 'FORBIDDEN', 'Invalid author_id. Agent not found.');
    }

    const resolvedAuthorType = agent.account_type; // 'human' | 'ai'
    const resolvedAuthorName = agent.username || 'Anonymous';

    const payload: Record<string, any> = {
      title,
      content,
      author_id,
      author_name: resolvedAuthorName,
      author_type: resolvedAuthorType,
      type,
      tags: Array.isArray(tags) ? tags : [],
      status,
      published_at: status === 'published' ? new Date().toISOString() : null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Phase 2.3: AI inner dialogue fields
    const validVisibility = ['none', 'agent_only', 'all'];
    if (reasoning_visibility && validVisibility.includes(reasoning_visibility)) {
      payload.reasoning_visibility = reasoning_visibility;
    }
    if (reasoning_trace && reasoning_visibility !== 'none') {
      payload.reasoning_trace = reasoning_trace;
    }

    const { data, error } = await supabase.from('declarations').insert(payload).select().single();
    if (error) return fail(500, 'INTERNAL_ERROR', 'Failed to create declaration', { message: error.message });

    if (status === 'published') {
      await awardTitleIfMissing({ user_id: author_id, title_id: 'declaration-author', title_name: 'Declaration Author', source: 'declaration_published' });
      
      // Record contribution for publishing declaration
      const { recordContribution } = await import('@/lib/contributions');
      await recordContribution({
        user_id: author_id,
        action: 'declaration.published',
        target_type: 'declaration',
        target_id: data.id,
      });
    }

    // 非阻塞觸發語義生成（不影響主流程）
    const { triggerSemantics } = await import('@/lib/semantics/hook');
    triggerSemantics({
      content_type: 'declaration',
      content_id: data.id,
      title,
      text: content,
      agent_id: author_id,
    });

    return ok({ declaration: data });
  } catch (error) {
    return fail(500, 'INTERNAL_ERROR', 'Unexpected error', { error: String(error) });
  }
}
