import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 查找用戶
    const { data: user, error: findError } = await supabase
      .from('agents')
      .select('id, email, email_verified')
      .eq('email', email)
      .single();

    if (findError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // 強制更新為已驗證
    const { error: updateError } = await supabase
      .from('agents')
      .update({ email_verified: true, is_verified: true })
      .eq('id', user.id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
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
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ message: 'POST with {email} to force verify' });
}
