/**
 * Event Sourcing — Projection State Management
 * Track and update projection cursor positions in the event stream.
 */

import { createClient } from '@supabase/supabase-js';
import type { EventProjection, ProjectionStatus } from './types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

function getSupabase() {
  return createClient(supabaseUrl, supabaseServiceKey);
}

/**
 * Get the current state of a projection.
 */
export async function getProjectionState(
  projectionName: string
): Promise<EventProjection | null> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('event_projections')
    .select('*')
    .eq('projection_name', projectionName)
    .single();

  if (error || !data) {
    return null;
  }

  return {
    id: data.id,
    projection_name: data.projection_name,
    last_event_id: data.last_event_id,
    last_sequence_number: data.last_sequence_number ?? 0,
    status: data.status,
    events_processed: data.events_processed ?? 0,
    last_rebuilt_at: data.last_rebuilt_at,
    error_message: data.error_message,
    created_at: data.created_at,
    updated_at: data.updated_at,
  } as EventProjection;
}

/**
 * Update a projection's cursor after processing events.
 */
export async function updateProjectionCursor(
  projectionName: string,
  lastEventId: string,
  lastSequenceNumber: number,
  eventsProcessedDelta: number = 1
): Promise<void> {
  const supabase = getSupabase();

  const { error } = await supabase
    .from('event_projections')
    .update({
      last_event_id: lastEventId,
      last_sequence_number: lastSequenceNumber,
      events_processed: supabase.rpc('increment_events_processed', {
        projection_name: projectionName,
        delta: eventsProcessedDelta,
      }),
      updated_at: new Date().toISOString(),
    })
    .eq('projection_name', projectionName);

  if (error) {
    console.error('[EventSourcing] Failed to update projection cursor:', error.message);
  }
}

/**
 * Set projection status (active, rebuilding, paused, error).
 */
export async function setProjectionStatus(
  projectionName: string,
  status: ProjectionStatus,
  errorMessage?: string
): Promise<void> {
  const supabase = getSupabase();

  const update: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  };

  if (errorMessage !== undefined) {
    update.error_message = errorMessage;
  }

  if (status === 'active') {
    update.error_message = null;
  }

  const { error } = await supabase
    .from('event_projections')
    .update(update)
    .eq('projection_name', projectionName);

  if (error) {
    console.error('[EventSourcing] Failed to set projection status:', error.message);
  }
}

/**
 * Record a projection rebuild completion.
 */
export async function recordRebuild(
  projectionName: string,
  eventsProcessed: number
): Promise<void> {
  const supabase = getSupabase();

  const { error } = await supabase
    .from('event_projections')
    .update({
      last_rebuilt_at: new Date().toISOString(),
      events_processed: eventsProcessed,
      status: 'active',
      error_message: null,
      updated_at: new Date().toISOString(),
    })
    .eq('projection_name', projectionName);

  if (error) {
    console.error('[EventSourcing] Failed to record rebuild:', error.message);
  }
}

/**
 * Initialize a new projection record if it doesn't exist.
 */
export async function initProjection(
  projectionName: string
): Promise<EventProjection> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('event_projections')
    .upsert({
      projection_name: projectionName,
      last_event_id: null,
      last_sequence_number: 0,
      status: 'active',
      events_processed: 0,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'projection_name' })
    .select()
    .single();

  if (error || !data) {
    throw new Error(`Failed to init projection ${projectionName}: ${error?.message}`);
  }

  return {
    id: data.id,
    projection_name: data.projection_name,
    last_event_id: data.last_event_id,
    last_sequence_number: data.last_sequence_number ?? 0,
    status: data.status,
    events_processed: data.events_processed ?? 0,
    last_rebuilt_at: data.last_rebuilt_at,
    error_message: data.error_message,
    created_at: data.created_at,
    updated_at: data.updated_at,
  } as EventProjection;
}
