import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { checkRateLimit, getClientIP, RateLimits } from '@/lib/rate-limit';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const secretKey = new TextEncoder().encode(JWT_SECRET);

export async function GET(request: NextRequest) {
  try {
  // Rate limiting - admin operations
  const clientIP = getClientIP(request);
  const rateLimit = checkRateLimit(clientIP, RateLimits.admin);
  if (!rateLimit.success) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfter || 60) } }
    );
  }
    const token = request.cookies.get('admin_session')?.value;
    
    if (!token) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    const { payload } = await jwtVerify(token, secretKey, {
      clockTolerance: 60,
    });
    
    // Check if token is expired
    const exp = payload.exp as number;
    if (exp && exp * 1000 < Date.now()) {
      return NextResponse.json(
        { error: 'Session expired' },
        { status: 401 }
      );
    }
    
    return NextResponse.json({
      success: true,
      admin: {
        id: payload.id,
        username: payload.username,
        role: payload.role
      }
    });
    
  } catch (error) {
    console.error('Admin auth check error:', error);
    return NextResponse.json(
      { error: 'Invalid session' },
      { status: 401 }
    );
  }
}
