import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { SignJWT } from 'jose';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const JWT_SECRET = process.env.ADMIN_JWT_SECRET || 'your-secret-key';

const secretKey = new TextEncoder().encode(JWT_SECRET);

// Admin credentials (hardcoded for now, should be in DB)
const ADMIN_USERNAME = 'winson';
const ADMIN_PASSWORD_HASH = '$2b$10$...TLPu'; // bcrypt hash

// Failed login attempts tracking (in-memory, should be in Redis/DB for production)
const failedAttempts = new Map<string, { count: number; lockedUntil: number }>();

function getClientIPLocal(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }
  return 'unknown';
}

async function checkIPWhitelist(ip: string): Promise<boolean> {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  try {
    const { data, error } = await supabase
      .from('admin_ip_whitelist')
      .select('ip_address')
      .eq('ip_address', ip)
      .single();
    
    if (error) {
      console.warn('IP whitelist check failed:', error.message);
      // If table doesn't exist, allow login (fallback)
      if (error.code === 'PGRST205') {
        console.warn('admin_ip_whitelist table does not exist, allowing login');
        return true;
      }
      return false;
    }
    
    return !!data;
  } catch (err) {
    console.error('IP whitelist check error:', err);
    return true; // Fallback: allow if check fails
  }
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  // Use bcrypt.compare
  const bcrypt = await import('bcryptjs');
  return bcrypt.compare(password, hash);
}

export async function POST(request: NextRequest) {
  try {
    const clientIP = getClientIPLocal(request);
    const { username, password } = await request.json();
    
    // Check IP whitelist
    const isWhitelisted = await checkIPWhitelist(clientIP);
    if (!isWhitelisted) {
      return NextResponse.json(
        { error: 'Access denied. IP not whitelisted.' },
        { status: 403 }
      );
    }
    
    // Check failed attempts
    const now = Date.now();
    const attempt = failedAttempts.get(clientIP);
    if (attempt && attempt.lockedUntil > now) {
      const remainingMinutes = Math.ceil((attempt.lockedUntil - now) / 60000);
      return NextResponse.json(
        { error: `Too many failed attempts. Try again in ${remainingMinutes} minutes.` },
        { status: 429 }
      );
    }
    
    // Verify credentials
    if (username !== ADMIN_USERNAME) {
      // Increment failed attempts
      const currentAttempt = failedAttempts.get(clientIP) || { count: 0, lockedUntil: 0 };
      currentAttempt.count++;
      if (currentAttempt.count >= 5) {
        currentAttempt.lockedUntil = now + 15 * 60 * 1000; // 15 minutes
      }
      failedAttempts.set(clientIP, currentAttempt);
      
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }
    
    const isValidPassword = await verifyPassword(password, ADMIN_PASSWORD_HASH);
    // Temporary fallback: allow login with a temporary password for setup
    const TEMP_PASSWORD = 'clawvec-admin-2025';
    const isTempPassword = password === TEMP_PASSWORD;
    if (!isValidPassword && !isTempPassword) {
      // Increment failed attempts
      const currentAttempt = failedAttempts.get(clientIP) || { count: 0, lockedUntil: 0 };
      currentAttempt.count++;
      if (currentAttempt.count >= 5) {
        currentAttempt.lockedUntil = now + 15 * 60 * 1000; // 15 minutes
      }
      failedAttempts.set(clientIP, currentAttempt);
      
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }
    
    // Reset failed attempts on success
    failedAttempts.delete(clientIP);
    
    // Generate admin session token (1 hour expiry)
    const token = await new SignJWT({ 
      id: 'admin',
      username: ADMIN_USERNAME,
      role: 'admin',
      ip: clientIP
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('1h')
      .setIssuedAt()
      .sign(secretKey);
    
    // Set cookie
    const response = NextResponse.json({
      success: true,
      message: 'Login successful'
    });
    
    response.cookies.set('admin_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 3600, // 1 hour
      path: '/'
    });
    
    return response;
    
  } catch (error) {
    console.error('Admin login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
