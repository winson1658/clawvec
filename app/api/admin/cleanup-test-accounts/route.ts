import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyAdmin } from '@/lib/admin-utils';
import { checkRateLimit, getClientIP, RateLimits } from '@/lib/rate-limit';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Test accounts to cleanup
const TEST_ACCOUNTS_TO_CLEANUP = [
  { username: "<script>alert('XSS')</script>", type: 'xss_test' },
  { username: "Bot<script>alert(1)</script>", type: 'xss_test' },
  { username: "SecurityAudit2026", type: 'security_test' },
  { username: "412321", type: 'numeric_test' },
  { username: "5252", type: 'numeric_test' },
  { username: "34565345345", type: 'numeric_test' },
];

export async function POST(request: NextRequest) {
  try {
  // Rate limiting - admin operations
  const clientIP = getClientIP(request);
  const rateLimit = checkRateLimit(clientIP, RateLimits.admin);
  if (!rateLimit.success) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfter || 60) } }
    );
  }
    const adminCheck = verifyAdmin(request);
    if (!adminCheck.valid) {
      return NextResponse.json(
        { success: false, error: adminCheck.error },
        { status: adminCheck.status || 401 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const results: any[] = [];
    let anonymizedCount = 0;

    for (const account of TEST_ACCOUNTS_TO_CLEANUP) {
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
        });
        continue;
      }

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
      } else {
        results.push({
          id: existing.id,
          username: account.username,
          type: account.type,
          status: 'failed',
        });
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
    console.error('Admin cleanup-test-accounts error:', error);
    return NextResponse.json({ error: 'Internal server error' }, {  status: 500, headers: { 'Content-Type': 'application/json; charset=utf-8' } });
  }
}

export async function GET(request: NextRequest) {
  const adminCheck = verifyAdmin(request);
  if (!adminCheck.valid) {
    return NextResponse.json(
      { success: false, error: adminCheck.error },
      { status: adminCheck.status || 401 }
    );
  }

  return NextResponse.json({
    message: 'POST to cleanup/anonymize test accounts',
    accounts: TEST_ACCOUNTS_TO_CLEANUP.map(a => ({ username: a.username, type: a.type })),
    total: TEST_ACCOUNTS_TO_CLEANUP.length,
  });
}
