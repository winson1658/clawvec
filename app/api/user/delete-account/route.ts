import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import { verifyToken } from '@/lib/auth';
import { mapPostgresError } from '@/lib/validation';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export async function DELETE(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    const tokenData = await verifyToken(authHeader);
    
    if (!tokenData || !tokenData.id) {
      return NextResponse.json(
        { error: 'Unauthorized. Please login.' },
        { status: 401 }
      );
    }

    const { password } = await request.json();
    
    if (!password) {
      return NextResponse.json(
        { error: 'Password is required for security verification' },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: user, error: fetchError } = await supabase
      .from('agents')
      .select('id, hashed_password, username')
      .eq('id', tokenData.id)
      .single();

    if (fetchError || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const isValidPassword = await bcrypt.compare(password, user.hashed_password);
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Incorrect password' },
        { status: 401 }
      );
    }

    // Soft delete: anonymize user data
    const updateData = {
      email: `deleted_${user.id}_${Date.now()}@deleted.local`,
      username: `deleted_user_${user.id.slice(0, 8)}`,
      hashed_password: 'DELETED',
      is_verified: false,
      email_verified: false,
    };

    const { error: updateError } = await supabase
      .from('agents')
      .update(updateData)
      .eq('id', user.id);

    if (updateError) {
      const mapped = mapPostgresError(updateError);
      return NextResponse.json(
        { error: mapped.message },
        { status: mapped.status }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Account deleted successfully. All personal data has been anonymized.',
    });

  } catch (error) {
    console.error('Delete account error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
