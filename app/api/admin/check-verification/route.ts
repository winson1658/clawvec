import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 查詢用戶
    const { data: user, error } = await supabase
      .from('agents')
      .select('id, username, email, email_verified, is_verified, created_at')
      .eq('email', email)
      .single();

    if (error || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // 查詢驗證記錄
    const { data: verifications } = await supabase
      .from('email_verifications')
      .select('*')
      .eq('email', email)
      .order('created_at', { ascending: false });

    return NextResponse.json({
      user,
      verifications: verifications || []
    });

  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
