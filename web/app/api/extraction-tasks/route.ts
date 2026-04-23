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

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sensorId = searchParams.get('sensor_id');
    const status = searchParams.get('status');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 50);
    const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1);
    const offset = (page - 1) * limit;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    let query = supabase
      .from('extraction_tasks')
      .select('*, sensor_configs(sensor_name, sensor_type)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (sensorId) query = query.eq('sensor_config_id', sensorId);
    if (status) query = query.eq('status', status);

    const { data, error, count } = await query;
    if (error) return fail(500, 'INTERNAL_ERROR', 'Failed to fetch tasks', { message: error.message });

    return ok({ items: data || [], pagination: { page, limit, total: count || 0 } });
  } catch (error) {
    return fail(500, 'INTERNAL_ERROR', 'Unexpected error', { error: String(error) });
  }
}
