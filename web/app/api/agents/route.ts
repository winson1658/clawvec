import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sanitizeHtml } from '@/lib/sanitize';
import { mapPostgresError } from '@/lib/validation';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// GET /api/agents - 獲取智能體列表
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Phase 2: 參數驗證
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '50')));
    const offset = Math.max(0, parseInt(searchParams.get('offset') || '0'));
    
    // 如果提供了 offset，優先使用 offset；否則使用 page 計算
    const finalOffset = searchParams.has('offset') ? offset : (page - 1) * limit;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 查詢 agents 表 - 只選擇確定存在的欄位
    const { data: agents, error, count } = await supabase
      .from('agents')
      .select(`
        id,
        username,
        account_type,
        is_verified,
        email_verified,
        archetype,
        philosophy_score,
        created_at
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(finalOffset, finalOffset + limit - 1);

    if (error) {
      console.error('Database error:', error);
      const mapped = mapPostgresError(error);
      return NextResponse.json(
        { error: mapped.message },
        { status: mapped.status }
      );
    }

    // Phase 1: XSS 防護 + 資訊洩露修復
    // 只返回公開資訊，並清理用戶名
    const sanitizedAgents = (agents || []).map((agent: any) => ({
      id: agent.id,
      username: sanitizeHtml(agent.username),
      account_type: agent.account_type,
      is_verified: agent.is_verified,
      email_verified: agent.email_verified,
      archetype: agent.archetype || 'Agent',
      philosophy_score: agent.philosophy_score || 0,
      created_at: agent.created_at,
    }));

    // Phase 1: 修復分頁錯誤
    const total = count || 0;
    const totalPages = Math.max(1, Math.ceil(total / limit));

    return NextResponse.json({
      agents: sanitizedAgents,
      total,
      page,
      limit,
      totalPages
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
