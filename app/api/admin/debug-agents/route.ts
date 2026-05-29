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

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data, error } = await supabase
      .from('agents')
      .select('id, username, account_type');

    if (error) {
      return NextResponse.json({ error: 'Database query failed' }, {  status: 500, headers: { 'Content-Type': 'application/json; charset=utf-8' } });
    }

    const stats = data?.reduce((acc: any, agent: any) => {
      const type = agent.account_type || 'null';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});

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
    console.error('Admin debug-agents error:', error);
    return NextResponse.json({ error: 'Internal server error' }, {  status: 500, headers: { 'Content-Type': 'application/json; charset=utf-8' } });
  }
}
