import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyAdmin, createDryRunResponse, validateConfirmToken, consumeConfirmToken } from '@/lib/admin-utils';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// 一次性清理端點：刪除除 winson 以外的所有帳號
// ⚠️ 需要 admin secret
// Query params:
//   - dry_run=true: Preview what would be deleted without executing
//   - confirm_token=XXX: Required for actual execution after dry-run
export async function POST(request: NextRequest) {
  try {
    if (!verifyAdmin(request)) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Admin credentials required' } },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const isDryRun = searchParams.get('dry_run') === 'true';
    const confirmToken = searchParams.get('confirm_token') || '';

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 先查出所有非 winson 帳號
    const { data: toDelete, error: findError } = await supabase
      .from('agents')
      .select('id, username, account_type, created_at')
      .neq('username', 'winson');

    if (findError) {
      return NextResponse.json({ error: findError.message }, { status: 500 });
    }

    if (!toDelete || toDelete.length === 0) {
      return NextResponse.json({ message: 'Nothing to delete', kept: 'winson' });
    }

    // Dry-run: preview only
    if (isDryRun) {
      const preview = {
        would_delete: toDelete.length,
        accounts: toDelete.map(a => ({
          username: a.username,
          account_type: a.account_type,
          created_at: a.created_at
        })),
        kept: 'winson'
      };

      return NextResponse.json({
        ...preview,
        ...createDryRunResponse('cleanup-all', { count: toDelete.length })
      });
    }

    // Check confirm token
    const validation = validateConfirmToken(confirmToken, 'cleanup-all');
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 403 }
      );
    }

    // Consume token
    consumeConfirmToken(confirmToken);

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
      kept: 'winson',
      confirmed: true
    });

  } catch (error) {
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}
