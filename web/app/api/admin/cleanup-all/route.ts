import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const adminSecret = process.env.ADMIN_SECRET_KEY || process.env.CRON_SECRET_KEY || '';

function verifyAdmin(request: NextRequest): boolean {
  const auth = request.headers.get('authorization') || '';
  const token = auth.replace(/^Bearer\s+/i, '');
  return token === adminSecret && adminSecret.length > 0;
}

// 一次性清理端點：刪除除 winson 以外的所有帳號
// ⚠️ 需要 admin secret
export async function POST(request: NextRequest) {
  try {
    if (!verifyAdmin(request)) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Admin credentials required' } },
        { status: 401 }
      );
    }

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
