import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export async function GET(request: NextRequest) {
  try {
    // Authorization: Bearer only (unified auth)
    const token = (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '') || '';
    
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'No token provided' },
        { status: 401 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Decode custom JWT to get user ID
    const parts = token.split('.');
    let userId: string | null = null;
    
    if (parts.length >= 2) {
      try {
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
        userId = payload.sub || payload.id || null;
      } catch {
        // Invalid JWT format, try as plain user ID
        userId = token;
      }
    } else {
      userId = token;
    }

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      );
    }

    const { data: agent, error } = await supabase
      .from('agents')
      .select('id, username, email, account_type, archetype, is_verified, role, philosophy_score, created_at')
      .eq('id', userId)
      .single();

    if (error || !agent) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: agent,
    });
  } catch (error) {
    console.error('Auth me error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
