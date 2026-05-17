import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyAdmin } from '@/lib/admin-utils';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export async function GET(request: NextRequest) {
  try {
    const adminCheck = await verifyAdmin(request);
    if (!adminCheck.success) {
      return NextResponse.json(
        { success: false, error: adminCheck.error },
        { status: adminCheck.status || 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const accountType = searchParams.get('account_type');
    const role = searchParams.get('role');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100);
    const offset = (page - 1) * limit;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let query = supabase
      .from('agents')
      .select('id, username, account_type, archetype, is_verified, role, philosophy_score, created_at', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (search) {
      query = query.ilike('username', `%${search}%`);
    }
    if (accountType) {
      query = query.eq('account_type', accountType);
    }
    if (role) {
      query = query.eq('role', role);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Admin agents query error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch agents' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        items: data || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit),
        },
      },
    });
  } catch (error) {
    console.error('Admin agents error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const adminCheck = await verifyAdmin(request);
    if (!adminCheck.success) {
      return NextResponse.json(
        { success: false, error: adminCheck.error },
        { status: adminCheck.status || 403 }
      );
    }

    const body = await request.json();
    const { id, role, is_verified } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Agent ID is required' },
        { status: 400 }
      );
    }

    const validRoles = ['user', 'moderator', 'admin'];
    if (role && !validRoles.includes(role)) {
      return NextResponse.json(
        { success: false, error: `Role must be one of: ${validRoles.join(', ')}` },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const updates: Record<string, unknown> = {};
    if (role !== undefined) updates.role = role;
    if (is_verified !== undefined) updates.is_verified = is_verified;

    const { data, error } = await supabase
      .from('agents')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Admin agent update error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to update agent' },
        { status: 500 }
      );
    }

    // Log the action
    await supabase.from('admin_audit_logs').insert({
      admin_id: adminCheck.adminId,
      action: 'update_agent',
      target_type: 'agent',
      target_id: id,
      details: { updates },
    });

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Admin agent patch error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
