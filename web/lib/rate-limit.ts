import { NextRequest, NextResponse } from 'next/server';

/**
 * 速率限制配置
 */
interface RateLimitConfig {
  windowMs: number;      // 時間窗口（毫秒）
  maxRequests: number;   // 最大請求數
  keyPrefix?: string;    // key 前綴
}

/**
 * 默認配置
 */
const DEFAULT_CONFIGS: Record<string, RateLimitConfig> = {
  // 公開讀取
  public_read: { windowMs: 60 * 1000, maxRequests: 120 },      // 120/min
  
  // 列表讀取
  list_read: { windowMs: 60 * 1000, maxRequests: 60 },         // 60/min
  
  // 寫入操作
  write: { windowMs: 60 * 60 * 1000, maxRequests: 30 },        // 30/hour
  
  // 敏感操作
  sensitive: { windowMs: 60 * 60 * 1000, maxRequests: 5 },     // 5/hour
  
  // 管理操作
  admin: { windowMs: 60 * 60 * 1000, maxRequests: 10 },        // 10/hour
};

/**
 * 簡易記憶體存儲（生產環境應使用 Redis）
 */
class MemoryStore {
  private store: Map<string, { count: number; resetTime: number }> = new Map();

  async increment(key: string, windowMs: number): Promise<{ count: number; limit: number; remaining: number; resetTime: number }> {
    const now = Date.now();
    const resetTime = now + windowMs;
    
    const record = this.store.get(key);
    
    if (!record || record.resetTime < now) {
      // 新窗口
      this.store.set(key, { count: 1, resetTime });
      return { count: 1, limit: 0, remaining: 0, resetTime };
    }
    
    // 增加計數
    record.count++;
    this.store.set(key, record);
    
    return { count: record.count, limit: 0, remaining: 0, resetTime: record.resetTime };
  }

  async reset(key: string): Promise<void> {
    this.store.delete(key);
  }
}

const store = new MemoryStore();

/**
 * 獲取請求 key
 */
function getRequestKey(req: NextRequest, config: RateLimitConfig): string {
  const ip = req.headers.get('x-forwarded-for') || 
             req.headers.get('x-real-ip') || 
             'unknown';
  
  // 如果用戶已登入，使用 user_id
  const authHeader = req.headers.get('Authorization');
  let userId = '';
  
  if (authHeader?.startsWith('Bearer ')) {
    try {
      const token = authHeader.slice(7);
      const payload = JSON.parse(Buffer.from(token.split('.')[1] || token, 'base64').toString());
      userId = payload.id || '';
    } catch {
      // ignore
    }
  }
  
  const keyPart = userId || ip;
  return `${config.keyPrefix || 'ratelimit'}:${keyPart}`;
}

/**
 * 速率限制中間件
 */
export async function rateLimit(
  req: NextRequest,
  config: RateLimitConfig | string
): Promise<{ allowed: boolean; limit: number; remaining: number; resetTime: number; retryAfter?: number }> {
  const actualConfig = typeof config === 'string' ? DEFAULT_CONFIGS[config] : config;
  
  if (!actualConfig) {
    throw new Error(`Unknown rate limit config: ${config}`);
  }
  
  const key = getRequestKey(req, actualConfig);
  const { count, resetTime } = await store.increment(key, actualConfig.windowMs);
  
  const allowed = count <= actualConfig.maxRequests;
  const remaining = Math.max(0, actualConfig.maxRequests - count);
  
  return {
    allowed,
    limit: actualConfig.maxRequests,
    remaining,
    resetTime,
    retryAfter: allowed ? undefined : Math.ceil((resetTime - Date.now()) / 1000),
  };
}

/**
 * 帶速率限制的 handler 包裝器
 */
export function withRateLimit(
  handler: (req: NextRequest) => Promise<NextResponse>,
  config: RateLimitConfig | string
) {
  return async (req: NextRequest) => {
    const result = await rateLimit(req, config);
    
    if (!result.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'RATE_LIMITED',
            message: 'Too many requests',
            details: {
              retry_after: result.retryAfter,
              limit: result.limit,
              window: '1h',
            },
          },
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': String(result.limit),
            'X-RateLimit-Remaining': String(result.remaining),
            'X-RateLimit-Reset': String(result.resetTime),
            'Retry-After': String(result.retryAfter || 60),
          },
        }
      );
    }
    
    const response = await handler(req);
    
    // 添加速率限制 headers
    response.headers.set('X-RateLimit-Limit', String(result.limit));
    response.headers.set('X-RateLimit-Remaining', String(result.remaining));
    response.headers.set('X-RateLimit-Reset', String(result.resetTime));
    
    return response;
  };
}

/**
 * 為 API 路由創建帶認證和速率限制的處理器
 */
export function createApiHandler(
  handler: (req: NextRequest, user: any) => Promise<NextResponse>,
  options: {
    rateLimit?: RateLimitConfig | string;
    requiredRole?: 'visitor' | 'human' | 'ai' | 'admin';
    requireVerified?: boolean;
  } = {}
) {
  return async (req: NextRequest) => {
    // 1. 速率限制
    if (options.rateLimit) {
      const rateResult = await rateLimit(req, options.rateLimit);
      
      if (!rateResult.allowed) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'RATE_LIMITED',
              message: 'Too many requests',
              details: { retry_after: rateResult.retryAfter },
            },
          },
          { status: 429 }
        );
      }
    }
    
    // 2. 認證檢查（這裡簡化，實際應調用 lib/auth.ts 的函數）
    // TODO: 整合認證邏輯
    
    return handler(req, null);
  };
}
