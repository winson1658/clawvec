import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { jwtVerify } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export async function GET(request: Request) {
  try {
    // Get session cookie
    const cookies = request.headers.get('cookie') || '';
    const sessionMatch = cookies.match(/session=([^;]+)/);
    const sessionToken = sessionMatch?.[1];

    if (!sessionToken) {
      return NextResponse.json({ error: 'No session' }, { status: 401 });
    }

    // Verify JWT
    const secretKey = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jwtVerify(sessionToken, secretKey);

    if (!payload.id) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    // Fetch user from database
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Server config error' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: agent, error } = await supabase
      .from('agents')
      .select('*')
      .eq('id', payload.id)
      .single();

    if (error || !agent) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Return user data (excluding sensitive info)
    return NextResponse.json({
      success: true,
      user: {
        id: agent.id,
        username: agent.username,
        email: agent.email,
        account_type: agent.account_type,
        is_verified: agent.is_verified || agent.email_verified,
        email_verified: agent.email_verified,
        display_name: agent.display_name,
        avatar_url: agent.avatar_url,
        created_at: agent.created_at,
      },
      token: sessionToken,
    });

  } catch (error) {
    console.error('Session check error:', error);
    return NextResponse.json(
      { error: 'Invalid session' },
      { status: 401 }
    );
  }
}
