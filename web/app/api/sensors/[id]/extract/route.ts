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

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { raw_content_url } = body;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get sensor config
    const { data: sensor, error: sensorError } = await supabase
      .from('sensor_configs')
      .select('*')
      .eq('id', id)
      .single();

    if (sensorError || !sensor) {
      return fail(404, 'NOT_FOUND', 'Sensor not found');
    }

    // Create extraction task
    const { data: task, error: taskError } = await supabase
      .from('extraction_tasks')
      .insert({
        sensor_config_id: id,
        status: 'running',
        raw_content_url: raw_content_url || null,
        started_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (taskError) {
      return fail(500, 'INTERNAL_ERROR', 'Failed to create extraction task', { message: taskError.message });
    }

    // Update sensor last_run_at
    await supabase.from('sensor_configs').update({
      last_run_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).eq('id', id);

    // For now, just mark as completed (actual extraction logic to be implemented)
    await supabase.from('extraction_tasks').update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      extracted_summary: `Extraction triggered for sensor "${sensor.sensor_name}" (${sensor.sensor_type})`,
    }).eq('id', task.id);

    return ok({
      task,
      message: `Extraction task created for sensor "${sensor.sensor_name}"`,
      note: 'Actual RSS/API fetching logic will be implemented in the next iteration.',
    });
  } catch (error) {
    return fail(500, 'INTERNAL_ERROR', 'Unexpected error', { error: String(error) });
  }
}
