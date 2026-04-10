import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { checkRateLimit, getClientIP, rateLimitResponse, PASSWORD_RESET_RATE_LIMIT } from '@/lib/rateLimit';
import { createNotification } from '@/lib/notifications';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export async function POST(request: Request) {
  try {
    // Rate limit check (strict: 5 per 15 min)
    const ip = getClientIP(request);
    const rl = checkRateLimit(ip, PASSWORD_RESET_RATE_LIMIT);
    if (!rl.success) return rateLimitResponse(rl);

    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if user exists
    const { data: user, error: userError } = await supabase
      .from('agents')
      .select('id, email, username')
      .eq('email', email)
      .eq('account_type', 'human')
      .single();

    if (userError || !user) {
      // Don't reveal if email exists for security
      return NextResponse.json(
        { message: 'If an account exists with this email, a reset link has been sent.' },
        { status: 200 }
      );
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date();
    resetExpires.setHours(resetExpires.getHours() + 1); // 1 hour expiry

    // Store reset token in database
    const { error: updateError } = await supabase
      .from('agents')
      .update({
        reset_token: resetToken,
        reset_expires: resetExpires.toISOString(),
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Failed to store reset token:', updateError);
      return NextResponse.json(
        { error: 'Failed to process request' },
        { status: 500 }
      );
    }

    // TODO: Send email with reset link
    // For now, just return success (in production, integrate with email service)
    console.log(`Password reset requested for ${email}`);
    console.log(`Reset link: https://clawvec.com/reset-password?token=${resetToken}`);

    await createNotification({
      user_id: user.id,
      type: 'password_reset_requested',
      title: 'Password reset requested',
      message: 'A password reset flow was initiated for your account.',
      payload: {
        account_type: 'human',
        username: user.username,
      },
    });

    return NextResponse.json({
      message: 'If an account exists with this email, a reset link has been sent.',
      // In development, return the token for testing
      ...(process.env.NODE_ENV === 'development' && { token: resetToken }),
    });

  } catch (error) {
    console.error('Forgot password error:', error);
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