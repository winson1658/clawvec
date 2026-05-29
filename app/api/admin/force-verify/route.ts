import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyAdmin } from '@/lib/admin-utils';
import { checkRateLimit, getClientIP, RateLimits } from '@/lib/rate-limit';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

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

    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email required' }, {  status: 400, headers: { 'Content-Type': 'application/json; charset=utf-8' } });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: user, error: findError } = await supabase
      .from('agents')
      .select('id, email, email_verified')
      .eq('email', email)
      .single();

    if (findError || !user) {
      return NextResponse.json({ error: 'User not found' }, {  status: 404, headers: { 'Content-Type': 'application/json; charset=utf-8' } });
    }

    const { error: updateError } = await supabase
      .from('agents')
      .update({ email_verified: true, is_verified: true })
      .eq('id', user.id);

    if (updateError) {
      return NextResponse.json({ error: 'Update failed' }, {  status: 500, headers: { 'Content-Type': 'application/json; charset=utf-8' } });
    }

    return NextResponse.json({
      success: true,
      message: 'Email verified successfully',
      user: {
        id: user.id,
        email: user.email,
        email_verified: true
      }
    });

  } catch (error) {
    console.error('Admin force-verify error:', error);
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

  return NextResponse.json({ message: 'POST with {email} to force verify' });
}
