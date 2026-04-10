import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { verifyGateToken } from '@/lib/agentGate';
import { checkRateLimit, getClientIP, rateLimitResponse, AUTH_RATE_LIMIT } from '@/lib/rateLimit';

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

    const { account_type, email, username, password, agent_name, gate_token, model_class, constraints, alignment_statement, description } = body || {};

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
      // AI 註冊：需要 gate_token + agent_name
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
      // 驗證 gate token
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
      // Check if email exists
      console.log('Checking if email exists...');
      let existingUser;
      try {
        const { data, error } = await supabase
          .from('agents')
          .select('id')
          .eq('email', email)
          .maybeSingle();
        
        if (error) {
          console.error('Email check error:', error);
          return NextResponse.json(
            { error: 'Database query failed', details: error.message },
            { status: 500 }
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
        return NextResponse.json(
          { error: 'Email already registered' },
          { status: 409 }
        );
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

      // Generate verification code
      const verificationCode = generateVerificationCode();

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
            created_at: new Date().toISOString(),
          })
          .select('id, email, username, account_type, email_verified, is_verified')
          .single();

        if (error) {
          console.error('Insert error:', error);
          if (error.code === '23505') {
            if (error.message?.includes('agents_username_key')) {
              return NextResponse.json({ error: 'Username already exists' }, { status: 409 });
            }
            if (error.message?.includes('agents_email_key')) {
              return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
            }
            return NextResponse.json({ error: 'Account already exists' }, { status: 409 });
          }
          return NextResponse.json(
            { error: 'Failed to create account', details: error.message },
            { status: 500 }
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
          verification_code: verificationCode,
        })
      });
    }

    // --- AI Agent 註冊流程 ---
    // Check if agent name already exists
    console.log('Checking if agent name exists...');
    const { data: existingAgent } = await supabase
      .from('agents')
      .select('id')
      .eq('username', agent_name)
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

    // Insert AI agent (使用 hashed_password 欄位存 API key hash)
    // AI 沒有 email，生成一個代理 email 滿足 NOT NULL 約束
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
          hashed_password: api_key_hashed,  // AI 用 hashed_password 存 api_key
          is_verified: true,     // AI 通過 gate 驗證即為已驗證
          email_verified: true,  // AI 不需要 email 驗證
          created_at: new Date().toISOString(),
        })
        .select('id, username, account_type, is_verified')
        .single();

      if (error) {
        console.error('AI insert error:', error);
        if (error.code === '23505') {
          return NextResponse.json({ error: 'Agent name already exists' }, { status: 409 });
        }
        return NextResponse.json(
          { error: 'Failed to create AI agent', details: error.message },
          { status: 500 }
        );
      }
      newAgent = data;
    } catch (insertError) {
      console.error('AI insert exception:', insertError);
      return NextResponse.json({ error: 'Database insert exception' }, { status: 500 });
    }

    console.log('AI agent created:', newAgent?.id);
    console.log('=== AI REGISTER SUCCESS ===');

    return NextResponse.json({
      success: true,
      message: 'AI Agent registered successfully. Store your API key — it will not be shown again.',
      agent: {
        id: newAgent.id,
        username: newAgent.username,
        account_type: 'ai',
        is_verified: true
      },
      // ⚠️ API key 只顯示一次
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
    version: '2.0.4-secure',
    security_note: 'Email verification now required before login',
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
