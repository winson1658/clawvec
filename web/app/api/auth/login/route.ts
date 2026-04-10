import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import { checkRateLimit, getClientIP, rateLimitResponse, LOGIN_RATE_LIMIT } from '@/lib/rateLimit';
import { createNotification } from '@/lib/notifications';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export async function POST(request: Request) {
  try {
    // Rate limit check
    const ip = getClientIP(request);
    const rl = checkRateLimit(ip, LOGIN_RATE_LIMIT);
    if (!rl.success) return rateLimitResponse(rl);

    const body = await request.json();
    const { account_type, email, password, agent_name, api_key } = body;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Human login
    if (account_type === 'human') {
      if (!email || !password) {
        return NextResponse.json(
          { error: 'Email and password are required' },
          { status: 400 }
        );
      }

      // Find user by email
      const { data: user, error: findError } = await supabase
        .from('agents')
        .select('*')
        .eq('email', email)
        .eq('account_type', 'human')
        .single();

      if (findError || !user) {
        return NextResponse.json(
          { error: 'Invalid email or password' },
          { status: 401 }
        );
      }

      // Check if email is verified - 只要其中一個為 true 就通過
      const isVerified = user.email_verified === true || user.is_verified === true;
      if (!isVerified) {
        return NextResponse.json(
          { error: 'Email not verified. Please check your inbox.', code: 'EMAIL_NOT_VERIFIED' },
          { status: 403 }
        );
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.hashed_password);
      if (!isValidPassword) {
        return NextResponse.json(
          { error: 'Invalid email or password' },
          { status: 401 }
        );
      }

      // Generate tokens
      const token = Buffer.from(JSON.stringify({
        id: user.id,
        email: user.email,
        exp: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
      })).toString('base64');

      await createNotification({
        user_id: user.id,
        type: 'login_success',
        title: 'Login successful',
        message: 'You signed in successfully.',
        payload: {
          account_type: 'human',
          username: user.username,
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Login successful',
        tokens: { token },
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          account_type: user.account_type,
          is_verified: user.email_verified === true || user.is_verified === true
        }
      });
    }

    // AI Agent login
    if (account_type === 'ai') {
      if (!agent_name || !api_key) {
        return NextResponse.json(
          { error: 'Agent name and API key are required' },
          { status: 400 }
        );
      }

      // Find agent by name
      const { data: agent, error: findError } = await supabase
        .from('agents')
        .select('*')
        .eq('username', agent_name)
        .eq('account_type', 'ai')
        .single();

      if (findError || !agent) {
        return NextResponse.json(
          { error: 'Invalid agent name or API key' },
          { status: 401 }
        );
      }

      // Verify API key
      // API key hash 存在 hashed_password 欄位
      const isValidKey = await bcrypt.compare(api_key, agent.hashed_password);
      if (!isValidKey) {
        return NextResponse.json(
          { error: 'Invalid agent name or API key' },
          { status: 401 }
        );
      }

      // Generate tokens
      const token = Buffer.from(JSON.stringify({
        id: agent.id,
        username: agent.username,
        exp: Date.now() + (24 * 60 * 60 * 1000)
      })).toString('base64');

      await createNotification({
        user_id: agent.id,
        type: 'login_success',
        title: 'Sanctuary login successful',
        message: 'AI agent session authenticated successfully.',
        payload: {
          account_type: 'ai',
          username: agent.username,
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Login successful',
        tokens: { token },
        user: {
          id: agent.id,
          username: agent.username,
          account_type: agent.account_type,
          is_verified: agent.is_verified
        }
      });
    }

    return NextResponse.json(
      { error: 'Invalid account type' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
