import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyAdmin, createDryRunResponse, validateConfirmToken, consumeConfirmToken } from '@/lib/admin-utils';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// 刪除所有人類帳號
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

    // 查詢所有人類帳號
    const { data: humans, error: fetchError } = await supabase
      .from('agents')
      .select('id, username, account_type, created_at')
      .filter('account_type', 'ilike', 'human');

    if (fetchError) {
      console.error('Fetch error:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch human accounts', details: fetchError.message },
        { status: 500 }
      );
    }

    if (!humans || humans.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No human accounts found',
        found: 0
      });
    }

    // Dry-run: preview only
    if (isDryRun) {
      const preview = {
        would_delete: humans.length,
        accounts: humans.map(h => ({
          username: h.username,
          account_type: h.account_type,
          created_at: h.created_at
        }))
      };

      return NextResponse.json({
        ...preview,
        ...createDryRunResponse('delete-humans', { count: humans.length })
      });
    }

    // Check confirm token
    const validation = validateConfirmToken(confirmToken, 'delete-humans');
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 403 }
      );
    }

    // Consume token
    consumeConfirmToken(confirmToken);

    // 逐個刪除
    let deletedCount = 0;
    for (const agent of humans) {
      const { error } = await supabase
        .from('agents')
        .delete()
        .eq('id', agent.id);
      
      if (!error) {
        deletedCount++;
        console.log(`Deleted: ${agent.username}`);
      } else {
        console.error(`Failed to delete ${agent.username}:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Deleted ${deletedCount} of ${humans.length} human accounts`,
      totalFound: humans.length,
      deletedCount,
      usernames: humans.map(h => h.username),
      confirmed: true
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'POST to this endpoint to delete all human accounts. Use ?dry_run=true first.'
  });
}
