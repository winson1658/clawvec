import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

/**
 * 驗證 JWT Token
 */
export function verifyToken(authHeader: string | null): { id: string; [key: string]: any } | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  
  const token = authHeader.slice(7);
  
  try {
    // 嘗試解析 JWT payload
    const base64Payload = token.split('.')[1];
    if (!base64Payload) return null;
    
    const payload = JSON.parse(Buffer.from(base64Payload, 'base64').toString());
    
    // 檢查過期
    if (payload.exp && payload.exp < Date.now() / 1000) return null;
    
    return payload;
  } catch {
    // 如果是 base64 編碼的簡單 token
    try {
      const decoded = JSON.parse(Buffer.from(token, 'base64').toString());
      if (decoded.exp && decoded.exp < Date.now()) return null;
      return decoded;
    } catch {
      return null;
    }
  }
}

/**
 * 驗證 API Key（AI 使用）
 */
export async function verifyApiKey(apiKey: string): Promise<{ id: string; [key: string]: any } | null> {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  // 這裡應該根據實際的 API key 存儲方式實現
  // 簡化版本：假設 API key 包含 user_id
  try {
    const decoded = JSON.parse(Buffer.from(apiKey, 'base64').toString());
    
    const { data: user } = await supabase
      .from('agents')
      .select('id, account_type, email_verified')
      .eq('id', decoded.user_id)
      .single();
    
    if (!user) return null;
    
    return { ...decoded, ...user };
  } catch {
    return null;
  }
}

/**
 * 獲取當前用戶
 */
export async function getCurrentUser(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  
    // 嘗試 JWT
  const jwtPayload = verifyToken(authHeader);
  if (jwtPayload?.sub || jwtPayload?.id) {
    const userId = jwtPayload.sub || jwtPayload.id;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { data: user } = await supabase
      .from('agents')
      .select('id, username, account_type, email_verified')
      .eq('id', userId)
      .single();
    
    if (user) return { ...jwtPayload, ...user };
  }
  
  // 嘗試 API Key
  const apiKey = request.headers.get('X-API-Key');
  if (apiKey) {
    return await verifyApiKey(apiKey);
  }
  
  return null;
}

/**
 * 檢查權限
 */
export function checkPermission(
  user: { account_type: string; email_verified?: boolean } | null,
  requiredRole: 'visitor' | 'human' | 'ai' | 'admin',
  requireVerified: boolean = false
): boolean {
  if (!user) return requiredRole === 'visitor';
  
  if (requireVerified && user.account_type === 'human' && !user.email_verified) {
    return false;
  }
  
  if (requiredRole === 'admin') {
    return user.account_type === 'admin';
  }
  
  if (requiredRole === 'ai') {
    return user.account_type === 'ai' || user.account_type === 'admin';
  }
  
  if (requiredRole === 'human') {
    return user.account_type === 'human' || user.account_type === 'admin';
  }
  
  return true;
}

/**
 * 認證中間件包裝器
 */
export function withAuth(
  handler: (req: NextRequest, user: any) => Promise<NextResponse>,
  options: {
    requiredRole?: 'visitor' | 'human' | 'ai' | 'admin';
    requireVerified?: boolean;
  } = {}
) {
  return async (req: NextRequest) => {
    const user = await getCurrentUser(req);
    
    if (!user && options.requiredRole && options.requiredRole !== 'visitor') {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHENTICATED', message: 'Login required' } },
        { status: 401 }
      );
    }
    
    if (options.requiredRole && !checkPermission(user as { account_type: string; email_verified?: boolean } | null, options.requiredRole, options.requireVerified)) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } },
        { status: 403 }
      );
    }
    
    return handler(req, user);
  };
}

/**
 * 創建標準錯誤回應
 */
export function createErrorResponse(
  status: number,
  code: string,
  message: string,
  details?: unknown
) {
  return NextResponse.json(
    { success: false, error: { code, message, ...(details ? { details } : {}) } },
    { status }
  );
}

/**
 * 創建標準成功回應
 */
export function createSuccessResponse(data: unknown, meta?: unknown) {
  return NextResponse.json({ success: true, data, ...(meta ? { meta } : {}) });
}
