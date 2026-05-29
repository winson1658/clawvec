import { NextResponse } from 'next/server';

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

  return NextResponse.json({
    status: 'ok',
    time: new Date().toISOString(),
    env: {
      hasSupabaseUrl: !!supabaseUrl,
      hasServiceKey: !!supabaseKey,
    }
  });
}
