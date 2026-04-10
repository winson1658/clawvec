import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// 需要清理的測試帳號清單 (根據 CLAWVEC_TODO.md)
const TEST_ACCOUNTS_TO_CLEANUP = [
  // XSS 測試帳號
  { username: "<script>alert('XSS')</script>", type: 'xss_test' },
  { username: "Bot<script>alert(1)</script>", type: 'xss_test' },
  
  // 安全測試帳號
  { username: "SecurityAudit2026", type: 'security_test' },
  
  // 數字測試帳號
  { username: "412321", type: 'numeric_test' },
  { username: "5252", type: 'numeric_test' },
  { username: "34565345345", type: 'numeric_test' },
];

export async function POST() {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const results: any[] = [];
    let anonymizedCount = 0;

    for (const account of TEST_ACCOUNTS_TO_CLEANUP) {
      // 先查詢該帳號的 ID
      const { data: existing, error: queryError } = await supabase
        .from('agents')
        .select('id, username, email, account_type, created_at')
        .eq('username', account.username)
        .single();

      if (queryError || !existing) {
        results.push({
          username: account.username,
          type: account.type,
          status: 'not_found',
          message: 'Account not found in database'
        });
        continue;
      }

      // 執行匿名化 (軟刪除)
      const timestamp = Date.now();
      const anonymousUsername = `deleted_${account.type}_${timestamp}_${existing.id.slice(0, 8)}`;
      const anonymousEmail = `deleted_${existing.id}_${timestamp}@deleted.local`;

      const { error: updateError } = await supabase
        .from('agents')
        .update({
          email: anonymousEmail,
          username: anonymousUsername,
          hashed_password: 'DELETED',
          is_verified: false,
          email_verified: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id);

      if (!updateError) {
        anonymizedCount++;
        results.push({
          id: existing.id,
          original_username: account.username,
          new_username: anonymousUsername,
          type: account.type,
          status: 'anonymized'
        });
        console.log(`Anonymized: ${account.username} -> ${anonymousUsername}`);
      } else {
        results.push({
          id: existing.id,
          username: account.username,
          type: account.type,
          status: 'failed',
          error: updateError.message
        });
        console.error(`Failed to anonymize ${account.username}:`, updateError);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${TEST_ACCOUNTS_TO_CLEANUP.length} test accounts, anonymized ${anonymizedCount}`,
      processed: TEST_ACCOUNTS_TO_CLEANUP.length,
      anonymized: anonymizedCount,
      results
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
    message: 'POST to cleanup/anonymize test accounts',
    accounts: TEST_ACCOUNTS_TO_CLEANUP.map(a => ({ username: a.username, type: a.type })),
    total: TEST_ACCOUNTS_TO_CLEANUP.length,
    note: 'This endpoint anonymizes (soft deletes) test accounts rather than hard deleting them'
  });
}