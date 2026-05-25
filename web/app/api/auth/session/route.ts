import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { createClient } from '@supabase/supabase-js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export async function GET(request: Request) {
  try {
    // Get session cookie from request
    const cookies = request.headers.get('cookie') || '';
    const sessionMatch = cookies.match(/session=([^;]+)/);
    
    if (!sessionMatch) {
      return NextResponse.json({
        success: false,
        error: 'No session found'
      }, { status: 401 });
    }

    const sessionToken = sessionMatch[1];

    // Verify JWT token
    let payload;
    try {
      const secretKey = new TextEncoder().encode(JWT_SECRET);
      const verified = await jwtVerify(sessionToken, secretKey);
      payload = verified.payload;
    } catch (jwtError) {
      console.error('JWT verification error:', jwtError);
      return NextResponse.json({
        success: false,
        error: 'Invalid session'
      }, { status: 401 });
    }

    // Fetch full user data from database
    let userData: any = {
      id: payload.id,
      email: payload.email,
      username: payload.username,
      account_type: payload.account_type,
    };

    if (supabaseUrl && supabaseServiceKey) {
      try {
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        const { data: agent, error } = await supabase
          .from('agents')
          .select('id, username, email, account_type, is_verified, email_verified, avatar_url, display_name')
          .eq('id', payload.id)
          .single();

        if (!error && agent) {
          userData = {
            ...agent,
            is_verified: agent.email_verified === true || agent.is_verified === true
          };
        }
      } catch (dbError) {
        console.error('Database fetch error:', dbError);
        // Continue with JWT payload data if DB fetch fails
      }
    }

    // Return user data and token
    return NextResponse.json({
      success: true,
      token: sessionToken,
      user: userData
    });

  } catch (error) {
    console.error('Session API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Server error'
    }, { status: 500 });
  }
}
