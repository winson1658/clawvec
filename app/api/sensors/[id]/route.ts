import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

function ok(data: unknown, meta?: unknown) {
  return NextResponse.json({ success: true, data, ...(meta ? { meta } : {}) });
}

function fail(status: number, code: string, message: string, details?: unknown) {
  return NextResponse.json({ success: false, error: { code, message, ...(details ? { details } : {}) } }, { status });
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data, error } = await supabase.from('sensor_configs').select('*').eq('id', id).single();
    if (error) {
      if (error.code === 'PGRST116') return fail(404, 'NOT_FOUND', 'Sensor not found');
      return fail(500, 'INTERNAL_ERROR', 'Failed to fetch sensor', { message: error.message });
    }

    return ok({ sensor: data });
  } catch (error) {
    return fail(500, 'INTERNAL_ERROR', 'Unexpected error', { error: String(error) });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { sensor_name, config, is_active } = body;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (sensor_name !== undefined) updates.sensor_name = sensor_name;
    if (config !== undefined) updates.config = config;
    if (is_active !== undefined) updates.is_active = is_active;
    if (is_active === true) updates.last_run_at = new Date().toISOString();

    const { data, error } = await supabase.from('sensor_configs').update(updates).eq('id', id).select().single();
    if (error) {
      if (error.code === 'PGRST116') return fail(404, 'NOT_FOUND', 'Sensor not found');
      if (error.message?.includes('duplicate key')) {
        return fail(409, 'DUPLICATE_NAME', 'A sensor with this name already exists');
      }
      return fail(500, 'INTERNAL_ERROR', 'Failed to update sensor', { message: error.message });
    }

    return ok({ sensor: data });
  } catch (error) {
    return fail(500, 'INTERNAL_ERROR', 'Unexpected error', { error: String(error) });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { error } = await supabase.from('sensor_configs').delete().eq('id', id);
    if (error) {
      if (error.code === 'PGRST116') return fail(404, 'NOT_FOUND', 'Sensor not found');
      return fail(500, 'INTERNAL_ERROR', 'Failed to delete sensor', { message: error.message });
    }

    return ok({ message: 'Sensor deleted' });
  } catch (error) {
    return fail(500, 'INTERNAL_ERROR', 'Unexpected error', { error: String(error) });
  }
}
