import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

let supabaseInstance: ReturnType<typeof createClient> | null = null;

function getSupabase() {
  if (!supabaseInstance) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    supabaseInstance = createClient(supabaseUrl, supabaseServiceKey);
  }
  return supabaseInstance;
}

/**
 * GET /api/agents/:id
 * 獲取 Agent 基本資料
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: { code: 'BAD_REQUEST', message: 'Agent ID is required' } },
        { status: 400 }
      );
    }

    const supabase = getSupabase();

    // 查詢基本 agent 資料
    const { data: agent, error } = await supabase
      .from('agents')
      .select('id, username, display_name, email, account_type, archetype, philosophy_score, is_verified, status, created_at, avatar_url, bio')
      .eq('id', id)
      .single();

    if (error || !agent) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Agent not found' } },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: agent
    });

  } catch (error: any) {
    console.error('Agent detail API error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } },
      { status: 500 }
    );
  }
}
