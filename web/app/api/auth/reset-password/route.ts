import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import { createNotification } from '@/lib/notifications';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export async function POST(request: Request) {
  try {
    const { token, password } = await request.json();

    if (!token || !password) {
      return NextResponse.json(
        { error: 'Token and password are required' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find user with valid reset token
    const { data: user, error: userError } = await supabase
      .from('agents')
      .select('id, username, reset_expires')
      .eq('reset_token', token)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Invalid or expired reset token' },
        { status: 400 }
      );
    }

    // Check if token is expired
    const resetExpires = new Date(user.reset_expires);
    if (resetExpires < new Date()) {
      return NextResponse.json(
        { error: 'Reset token has expired' },
        { status: 400 }
      );
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(password, 10);

    // Update password and clear reset token
    const { error: updateError } = await supabase
      .from('agents')
      .update({
        password_hash: passwordHash,
        reset_token: null,
        reset_expires: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Failed to update password:', updateError);
      return NextResponse.json(
        { error: 'Failed to reset password' },
        { status: 500 }
      );
    }

    await createNotification({
      user_id: user.id,
      type: 'password_reset_completed',
      title: 'Password reset successful',
      message: 'Your account password was updated successfully.',
      payload: {
        account_type: 'human',
        username: user.username,
      },
    });

    return NextResponse.json({
      message: 'Password reset successful',
    });

  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}