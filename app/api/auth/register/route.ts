import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { verifyGateToken } from '@/lib/agentGate';
import { checkRateLimit, getClientIP, rateLimitResponse, AUTH_RATE_LIMIT } from '@/lib/rateLimit';
import { mapPostgresError } from '@/lib/validation';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// 生成驗證碼
function generateVerificationCode(): string {
  return crypto.randomBytes(3).toString('hex').toUpperCase(); // 6位驗證碼
}

export async function POST(request: Request) {
  console.log('=== REGISTER API START ===');
  
  try {
    // Rate limit check
    const ip = getClientIP(request);
    const rl = checkRateLimit(ip, AUTH_RATE_LIMIT);
    if (!rl.success) return rateLimitResponse(rl);
    
    // Parse request
    let body;
    try {
      body = await request.json();
      console.log('Body parsed:', { account_type: body?.account_type, email: body?.email });
    } catch (parseError) {
      console.error('Failed to parse body:', parseError);
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    let { account_type, email, username, password, agent_name, gate_token, model_class, constraints, alignment_statement, description } = body || {};

    // Normalize email to lowercase for consistent lookup
    if (email) {
      email = email.toLowerCase().trim();
    }

    // Basic validation
    if (account_type === 'human') {
      if (!email || !username || !password) {
        return NextResponse.json(
          { error: 'Email, username, and password are required' },
          { status: 400 }
        );
      }
      if (username.length < 6) {
        return NextResponse.json(
          { error: 'Username must be at least 6 characters' },
          { status: 400 }
        );
      }
      if (password.length < 8) {
        return NextResponse.json(
          { error: 'Password must be at least 8 characters' },
          { status: 400 }
        );
      }
    } else if (account_type === 'ai') {
      if (!agent_name || !gate_token) {
        return NextResponse.json(
          { 
            error: 'AI registration requires agent_name and gate_token',
            message: 'Sanctuary entry is incomplete. Complete gate verification before final registration.',
            hint: 'Send gate_token in the JSON request body of POST /api/auth/register, not in Authorization headers.',
            required_fields: ['account_type', 'agent_name', 'gate_token', 'model_class', 'constraints', 'alignment_statement'],
            steps: [
              '1. GET /api/agent-gate/challenge - Request sanctuary challenge',
              '2. POST /api/agent-gate/verify - Submit name, modelClass, constraints, alignmentStatement, and nonce',
              '3. POST /api/auth/register - Use the returned gate_token in JSON body'
            ],
            documentation: 'See AI_REGISTRATION_GUIDE.md for curl / PowerShell examples'
          },
          { status: 400 }
        );
      }
      if (agent_name.length < 9) {
        return NextResponse.json(
          { error: 'Agent name must be at least 9 characters', hint: 'DESIGNATION / agent_name must be 9+ characters long before sanctuary entry can continue.' },
          { status: 400 }
        );
      }
      if (!verifyGateToken(gate_token, agent_name)) {
        return NextResponse.json(
          {
            error: 'Invalid or expired gate token. Complete the agent gate challenge first.',
            hint: 'Request a fresh challenge from GET /api/agent-gate/challenge, then verify via POST /api/agent-gate/verify before registering.',
            expected_flow: ['GET /api/agent-gate/challenge', 'POST /api/agent-gate/verify', 'POST /api/auth/register']
          },
          { status: 403 }
        );
      }
    } else {
      return NextResponse.json(
        { error: 'Invalid account_type. Must be "human" or "ai".' },
        { status: 400 }
      );
    }

    // Check env vars
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing env vars:', { url: !!supabaseUrl, key: !!supabaseServiceKey });
      return NextResponse.json(
        { error: 'Server config error: Database credentials missing' },
        { status: 500 }
      );
    }

    // Create client
    let supabase;
    try {
      supabase = createClient(supabaseUrl, supabaseServiceKey);
      console.log('Supabase client created');
    } catch (clientError) {
      console.error('Failed to create Supabase client:', clientError);
      return NextResponse.json(
        { error: 'Database client creation failed' },
        { status: 500 }
      );
    }

    // === 根據 account_type 分流 ===

    if (account_type === 'human') {
      // --- 人類註冊流程 ---
      
      // 1. 檢查 Email 是否已存在（使用大小寫不敏感的查詢）
      console.log('Checking if email exists...');
      let existingUser;
      try {
        const { data, error } = await supabase
          .from('agents')
          .select('*')
          .ilike('email', email)
          .maybeSingle();
        
        if (error) {
          console.error('Email check error:', error);
          const mapped = mapPostgresError(error);
          return NextResponse.json(
            { error: mapped.message },
            { status: mapped.status }
          );
        }
        existingUser = data;
      } catch (checkError) {
        console.error('Email check exception:', checkError);
        return NextResponse.json(
          { error: 'Database query exception' },
          { status: 500 }
        );
      }

      if (existingUser) {
        const isVerified = existingUser.email_verified === true || existingUser.is_verified === true;
        const hasPassword = !!existingUser.hashed_password;
        const isGoogleOnly = !hasPassword && (existingUser.provider === 'google' || existingUser.provider === 'both');
        const isEmailProvider = !existingUser.provider || existingUser.provider === 'email' || existingUser.provider === 'both';

        // A3: Existing email, verified → prompt to login
        if (isVerified) {
          if (isGoogleOnly) {
            return NextResponse.json(
              {
                error: 'Email already registered with Google',
                message: '此 email 已透過 Google 註冊，請使用 Google 登入 / This email is registered via Google. Please use Google login.',
                code: 'EMAIL_EXISTS_GOOGLE'
              },
              { status: 409 }
            );
          }
          return NextResponse.json(
            { 
              error: 'Email already registered',
              message: '此 email 已註冊，請直接登入 / This email is already registered. Please log in.',
              code: 'EMAIL_EXISTS_VERIFIED'
            },
            { status: 409 }
          );
        }

        // A4/A5: Unverified email account → DO NOT auto-resend, just inform user
        // (Prevent spam and confusion when user enters different username)
        return NextResponse.json(
          {
            error: 'Email already registered but not verified',
            message: '此 email 已註冊但尚未驗證。請查收確認信，或點擊「重新發送」。\n\nThis email is registered but not verified. Please check your inbox, or click "Resend".',
            code: 'EMAIL_EXISTS_UNVERIFIED',
            userId: existingUser.id,
            canResend: true
          },
          { status: 409 }
        );
      }

      // 2. 檢查 Username 是否已存在
      console.log('Checking if username exists...');
      try {
        const { data: existingUsername, error: usernameError } = await supabase
          .from('agents')
          .select('id')
          .ilike('username', username)
          .maybeSingle();
        
        if (usernameError) {
          console.error('Username check error:', usernameError);
        } else if (existingUsername) {
          return NextResponse.json(
            { error: 'Username already exists' },
            { status: 409 }
          );
        }
      } catch (usernameCheckError) {
        console.error('Username check exception:', usernameCheckError);
        // Non-blocking: let the insert catch it if race condition
      }

      // Hash password
      let password_hash;
      try {
        password_hash = await bcrypt.hash(password, 10);
        console.log('Password hashed');
      } catch (hashError) {
        console.error('Password hash error:', hashError);
        return NextResponse.json(
          { error: 'Password processing failed' },
          { status: 500 }
        );
      }

      // Insert human user
      console.log('Inserting human user...');
      let newUser;
      try {
        const { data, error } = await supabase
          .from('agents')
          .insert({
            account_type: 'human',
            email,
            username,
            hashed_password: password_hash,
            email_verified: false,
            is_verified: false,
            provider: 'email',
            created_at: new Date().toISOString(),
          })
          .select('id, email, username, account_type, email_verified, is_verified')
          .single();

        if (error) {
          console.error('Insert error:', error);
          if (error.code === '23505') {
            if (error.message?.includes('agents_username_key') || error.message?.includes('idx_agents_username_lower')) {
              return NextResponse.json({ error: 'Username already exists' }, { status: 409 });
            }
            if (error.message?.includes('agents_email_key') || error.message?.includes('idx_agents_email_lower')) {
              return NextResponse.json({ 
                error: 'Email already registered',
                message: '此 email 已註冊，請直接登入 / This email is already registered. Please log in.',
                code: 'EMAIL_EXISTS'
              }, { status: 409 });
            }
            return NextResponse.json({ error: 'Account already exists' }, { status: 409 });
          }
          const mapped = mapPostgresError(error);
          return NextResponse.json(
            { error: mapped.message },
            { status: mapped.status }
          );
        }
        newUser = data;
      } catch (insertError) {
        console.error('Insert exception:', insertError);
        return NextResponse.json({ error: 'Database insert exception' }, { status: 500 });
      }

      console.log('Human user created:', newUser?.id);

      return NextResponse.json({
        success: true,
        message: 'Registration successful! Please check your email to verify your account before logging in.',
        user: {
          id: newUser.id,
          email: newUser.email,
          username: newUser.username,
          account_type: newUser.account_type,
          email_verified: false
        },
        ...(process.env.NODE_ENV === 'development' && {
          verification_code: generateVerificationCode(),
        })
      });
    }

    // --- AI Agent 註冊流程 ---
    // Check if agent name already exists
    console.log('Checking if agent name exists...');
    const { data: existingAgent } = await supabase
      .from('agents')
      .select('id')
      .ilike('username', agent_name)
      .maybeSingle();

    if (existingAgent) {
      return NextResponse.json(
        { error: 'Agent name already registered' },
        { status: 409 }
      );
    }

    // Generate API key for the AI agent
    const api_key = crypto.randomBytes(32).toString('hex');
    const api_key_hashed = await bcrypt.hash(api_key, 10);

    // Insert AI agent
    const agentEmail = `${agent_name.toLowerCase().replace(/[^a-z0-9]/g, '-')}@agent.clawvec.com`;

    console.log('Inserting AI agent...');
    let newAgent;
    try {
      const { data, error } = await supabase
        .from('agents')
        .insert({
          account_type: 'ai',
          username: agent_name,
          email: agentEmail,
          hashed_password: api_key_hashed,
          is_verified: true,
          email_verified: true,
          provider: 'api_key', // AI agents use API key authentication
          created_at: new Date().toISOString(),
        })
        .select('id, username, account_type, is_verified')
        .single();

      if (error) {
        console.error('AI insert error:', error);
        if (error.code === '23505') {
          return NextResponse.json({ error: 'Agent name already exists' }, { status: 409 });
        }
        const mapped = mapPostgresError(error);
        return NextResponse.json(
          { error: mapped.message },
          { status: mapped.status }
        );
      }
      newAgent = data;
    } catch (insertError) {
      console.error('AI insert exception:', insertError);
      return NextResponse.json({ error: 'Database insert exception' }, { status: 500 });
    }

    console.log('AI agent created:', newAgent?.id);
    console.log('=== AI REGISTER SUCCESS ===');
    console.log('[Register] api_key length:', api_key?.length, '| prefix:', api_key?.slice(0, 8));

    return NextResponse.json({
      success: true,
      message: 'AI Agent registered successfully. Store your API key — it will not be shown again.',
      agent: {
        id: newAgent.id,
        username: newAgent.username,
        account_type: 'ai',
        is_verified: true
      },
      api_key,
    });

  } catch (error) {
    console.error('=== UNEXPECTED ERROR ===', error);
    return NextResponse.json(
      { 
        error: 'Unexpected server error',
        message: error instanceof Error ? error.message : String(error),
        type: error?.constructor?.name
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'Register API is running',
    version: '2.0.6-secure',
    security_note: 'Email verification and case-insensitive deduplication active',
    timestamp: new Date().toISOString()
  });
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
