import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyAdmin } from '@/lib/admin-utils';
import { checkRateLimit, getClientIP, RateLimits } from '@/lib/rate-limit';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username') || 'winson';

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data, error } = await supabase
      .from('agents')
      .select('id, username, email, account_type, is_verified, email_verified, status, created_at, hashed_password')
      .eq('username', username)
      .single();

    if (error) {
      return NextResponse.json({ error: 'Database query failed' }, {  status: 500, headers: { 'Content-Type': 'application/json; charset=utf-8' } });
    }

    // Return all fields except password
    return NextResponse.json({
      id: data.id,
      username: data.username,
      email: data.email,
      account_type: data.account_type,
      is_verified: data.is_verified,
      email_verified: data.email_verified,
      status: data.status,
      created_at: data.created_at,
      has_password: !!data.hashed_password,
    });

  } catch (error) {
    console.error('Admin check-user error:', error);
    return NextResponse.json({ error: 'Internal server error' }, {  status: 500, headers: { 'Content-Type': 'application/json; charset=utf-8' } });
  }
}
