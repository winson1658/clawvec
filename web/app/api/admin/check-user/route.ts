import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username') || 'winson';

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data, error } = await supabase
      .from('agents')
      .select('*')
      .eq('username', username)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 返回所有欄位但不暴露密碼
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
      password_length: data.hashed_password?.length
    });

  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
