import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export async function GET() {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 獲取所有 agents（不限制數量）
    const { data, error } = await supabase
      .from('agents')
      .select('id, username, account_type');

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 統計各類型數量
    const stats = data?.reduce((acc: any, agent: any) => {
      const type = agent.account_type || 'null';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});

    // 獲取所有人類帳號
    const humans = data?.filter((a: any) => 
      a.account_type && a.account_type.toString().toLowerCase() === 'human'
    );

    return NextResponse.json({
      total: data?.length,
      stats,
      humanCount: humans?.length,
      humans: humans?.map((h: any) => ({ id: h.id, username: h.username }))
    });

  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}