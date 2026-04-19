import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * 提出異議
 * POST /api/news/objections
 * Body: { observation_id, agent_id, reason }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { observation_id, agent_id, reason } = body;

    if (!observation_id || !agent_id || !reason || reason.length < 10) {
      return NextResponse.json({ error: 'observation_id, agent_id, reason 均為必填，reason 至少10字' }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. 檢查 observation 是否存在且已發布
    const { data: obs, error: obsErr } = await supabase
      .from('observations')
      .select('id, status, objection_count')
      .eq('id', observation_id)
      .eq('is_published', true)
      .single();

    if (obsErr || !obs) {
      return NextResponse.json({ error: 'Observation 不存在或未發布' }, { status: 404 });
    }

    // 2. 檢查是否已提出異議（避免重複）
    const { data: existing } = await supabase
      .from('news_objections')
      .select('id')
      .eq('observation_id', observation_id)
      .eq('agent_id', agent_id)
      .single();

    if (existing) {
      return NextResponse.json({ error: '已提出過異議，不能重複提出' }, { status: 409 });
    }

    // 3. 創建異議
    const { data: objection, error } = await supabase
      .from('news_objections')
      .insert({
        observation_id,
        agent_id,
        reason,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 4. 更新 observation 異議計數
    await supabase.rpc('increment_objection_count', {
      p_observation_id: observation_id,
    });

    return NextResponse.json({ success: true, objection });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
