import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// 一次性清理端點：刪除除 winson 以外的所有帳號
export async function POST() {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 先查出所有非 winson 帳號
    const { data: toDelete, error: findError } = await supabase
      .from('agents')
      .select('id, username, account_type')
      .neq('username', 'winson');

    if (findError) {
      return NextResponse.json({ error: findError.message }, { status: 500 });
    }

    if (!toDelete || toDelete.length === 0) {
      return NextResponse.json({ message: 'Nothing to delete', kept: 'winson' });
    }

    const ids = toDelete.map(a => a.id);

    // 批量刪除
    const { error: deleteError } = await supabase
      .from('agents')
      .delete()
      .in('id', ids);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      deleted: toDelete.length,
      accounts: toDelete.map(a => a.username),
      kept: 'winson'
    });

  } catch (error) {
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}
