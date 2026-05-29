import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyAdmin } from '@/lib/admin-utils';
import { checkRateLimit, getClientIP, RateLimits } from '@/lib/rate-limit';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const VALID_TYPES = ['observations', 'daily_news', 'debates', 'discussions', 'declarations'] as const;
type ContentType = typeof VALID_TYPES[number];

const TYPE_CONFIG: Record<ContentType, { table: string; statusField: string; validStatuses: string[] }> = {
  observations: {
    table: 'observations',
    statusField: 'status',
    validStatuses: ['published', 'draft', 'archived'],
  },
  daily_news: {
    table: 'daily_news',
    statusField: 'status',
    validStatuses: ['active', 'archived'],
  },
  debates: {
    table: 'debates',
    statusField: 'status',
    validStatuses: ['active', 'waiting', 'ended'],
  },
  discussions: {
    table: 'discussions',
    statusField: 'is_locked',
    validStatuses: ['true', 'false'],
  },
  declarations: {
    table: 'declarations',
    statusField: 'status',
    validStatuses: ['published', 'draft'],
  },
};

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    const adminCheck = await verifyAdmin(request);
    if (!adminCheck.valid) {
      return NextResponse.json(
        { success: false, error: adminCheck.error?.message || 'Unauthorized' },
        { status: adminCheck.status || 403 }
      );
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') as ContentType | null;

    if (!type || !VALID_TYPES.includes(type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid or missing content type' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { status, ...otherUpdates } = body;

    const config = TYPE_CONFIG[type];
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Validate status
    if (status !== undefined && !config.validStatuses.includes(String(status))) {
      return NextResponse.json(
        { success: false, error: `Invalid status. Must be one of: ${config.validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    // Build update payload
    const updates: Record<string, unknown> = { ...otherUpdates };
    if (status !== undefined) {
      if (type === 'discussions') {
        updates[config.statusField] = status === 'true' || status === true;
      } else {
        updates[config.statusField] = status;
      }
    }

    // Add updated_at timestamp
    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from(config.table)
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Admin content update error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to update content' },
        { status: 500 }
      );
    }

    // Log the action
    await supabase.from('admin_audit_logs').insert({
      admin_id: adminCheck.adminId,
      action: 'update_content',
      target_type: type,
      target_id: id,
      details: { updates },
    });

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Admin content patch error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminCheck = await verifyAdmin(request);
    if (!adminCheck.valid) {
      return NextResponse.json(
        { success: false, error: adminCheck.error?.message || 'Unauthorized' },
        { status: adminCheck.status || 403 }
      );
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') as ContentType | null;

    if (!type || !VALID_TYPES.includes(type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid or missing content type' },
        { status: 400 }
      );
    }

    const config = TYPE_CONFIG[type];
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { error } = await supabase
      .from(config.table)
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Admin content delete error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to delete content' },
        { status: 500 }
      );
    }

    // Log the action
    await supabase.from('admin_audit_logs').insert({
      admin_id: adminCheck.adminId,
      action: 'delete_content',
      target_type: type,
      target_id: id,
    });

    return NextResponse.json({
      success: true,
      message: 'Content deleted successfully',
    });
  } catch (error) {
    console.error('Admin content delete error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
