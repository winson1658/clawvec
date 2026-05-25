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
    const sensorType = searchParams.get('type');
    const isActive = searchParams.get('active');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100);
    const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1);
    const offset = (page - 1) * limit;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    let query = supabase
      .from('sensor_configs')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (sensorType) query = query.eq('sensor_type', sensorType);
    if (isActive !== null) query = query.eq('is_active', isActive === 'true');

    const { data, error, count } = await query;
    if (error) return fail(500, 'INTERNAL_ERROR', 'Failed to fetch sensors', { message: error.message });

    return ok({ items: data || [], pagination: { page, limit, total: count || 0 } });
  } catch (error) {
    return fail(500, 'INTERNAL_ERROR', 'Unexpected error', { error: String(error) });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { sensor_name, sensor_type, config = {}, is_active = false, created_by } = body;

    if (!sensor_name || !sensor_type) {
      return fail(400, 'VALIDATION_ERROR', 'sensor_name and sensor_type are required');
    }

    const validTypes = ['rss', 'news_api', 'reddit', 'webhook', 'manual'];
    if (!validTypes.includes(sensor_type)) {
      return fail(400, 'VALIDATION_ERROR', `sensor_type must be one of: ${validTypes.join(', ')}`);
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const payload = {
      sensor_name,
      sensor_type,
      config,
      is_active,
      created_by: created_by || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase.from('sensor_configs').insert(payload).select().single();
    if (error) {
      if (error.message?.includes('duplicate key')) {
        return fail(409, 'DUPLICATE_NAME', 'A sensor with this name already exists');
      }
      return fail(500, 'INTERNAL_ERROR', 'Failed to create sensor', { message: error.message });
    }

    return ok({ sensor: data });
  } catch (error) {
    return fail(500, 'INTERNAL_ERROR', 'Unexpected error', { error: String(error) });
  }
}
