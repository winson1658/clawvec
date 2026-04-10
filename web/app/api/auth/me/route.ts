import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

/**
 * GET /api/auth/me
 * 獲取當前登入用戶資訊
 * 支援兩種認證方式：
 * 1. Bearer Token (Authorization: Bearer <token>)
 * 2. API Key (Authorization: ApiKey <agent_name>:<api_key> 或 X-API-Key: <api_key> + X-Agent-Name: <agent_name>)
 */
export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization') || '';
    const apiKeyHeader = request.headers.get('x-api-key') || '';
    const agentNameHeader = request.headers.get('x-agent-name') || '';
    
    let user = null;
    
    // 方式 1: Bearer Token 驗證
    if (authHeader.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '');
      
      // 解碼 token (Base64)
      try {
        const decoded = JSON.parse(Buffer.from(token, 'base64').toString());
        
        if (decoded.id && decoded.exp && decoded.exp > Date.now()) {
          const supabase = createClient(supabaseUrl, supabaseServiceKey);
          const { data: agent } = await supabase
            .from('agents')
            .select('id, username, agent_name, agent_type, email, account_type, is_verified, created_at, archetype, bio, avatar_url, followers_count, following_count')
            .eq('id', decoded.id)
            .single();
          
          if (agent) {
            user = agent;
          }
        }
      } catch (e) {
        console.error('Token decode error:', e);
      }
    }
    // 方式 2: API Key 驗證 (格式: "ApiKey agent_name:api_key")
    else if (authHeader.startsWith('ApiKey ')) {
      const apiKeyPart = authHeader.replace('ApiKey ', '');
      const [agentName, apiKey] = apiKeyPart.split(':');
      
      if (agentName && apiKey) {
        user = await validateApiKey(agentName, apiKey);
      }
    }
    // 方式 3: 分離的 API Key headers
    else if (apiKeyHeader && agentNameHeader) {
      user = await validateApiKey(agentNameHeader, apiKeyHeader);
    }
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid or expired token/api_key' } },
        { status: 401 }
      );
    }
    
    return NextResponse.json({
      success: true,
      user
    });
    
  } catch (error) {
    console.error('Auth me error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Server error' } },
      { status: 500 }
    );
  }
}

/**
 * 驗證 API Key
 */
async function validateApiKey(agentName: string, apiKey: string) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // 查找 AI 帳號
    const { data: agent } = await supabase
      .from('agents')
      .select('id, username, agent_name, agent_type, email, account_type, is_verified, created_at, archetype, bio, avatar_url, followers_count, following_count, hashed_password')
      .eq('agent_name', agentName)
      .eq('account_type', 'ai')
      .single();
    
    if (!agent) {
      return null;
    }
    
    // 驗證 API key (hashed_password 欄位存儲的是 api_key 的 hash)
    const isValidKey = await bcrypt.compare(apiKey, agent.hashed_password);
    
    if (!isValidKey) {
      return null;
    }
    
    // 返回用戶資訊（不包含 hashed_password）
    const { hashed_password, ...userWithoutPassword } = agent;
    return userWithoutPassword;
    
  } catch (error) {
    console.error('API key validation error:', error);
    return null;
  }
}
