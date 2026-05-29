/**
 * Event Sourcing — Query Utility
 * Query the immutable event log with filters and pagination.
 */

import { createClient } from '@supabase/supabase-js';
import type { ClawvecEvent, EventQueryFilters, EventQueryResult } from './types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

function getSupabase() {
  return createClient(supabaseUrl, supabaseServiceKey);
}

/**
 * Query events from the immutable event log.
 *
 * Usage:
 *   const { events, total, hasMore } = await queryEvents({
 *     target_type: 'observation',
 *     target_id: observationId,
 *     limit: 50,
 *   });
 */
export async function queryEvents(
  filters: EventQueryFilters = {}
): Promise<EventQueryResult> {
  const supabase = getSupabase();

  let query = supabase
    .from('events')
    .select('*', { count: 'exact' });

  if (filters.event_types && filters.event_types.length > 0) {
    query = query.in('event_type', filters.event_types);
  }

  if (filters.actor_id) {
    query = query.eq('actor_id', filters.actor_id);
  }

  if (filters.actor_type) {
    query = query.eq('actor_type', filters.actor_type);
  }

  if (filters.target_type) {
    query = query.eq('target_type', filters.target_type);
  }

  if (filters.target_id) {
    query = query.eq('target_id', filters.target_id);
  }

  if (filters.from) {
    query = query.gte('occurred_at', filters.from);
  }

  if (filters.to) {
    query = query.lte('occurred_at', filters.to);
  }

  if (filters.causation_id) {
    query = query.eq('causation_id', filters.causation_id);
  }

  if (filters.correlation_id) {
    query = query.eq('correlation_id', filters.correlation_id);
  }

  const limit = Math.min(filters.limit ?? 50, 200);
  const offset = filters.offset ?? 0;

  query = query
    .order('occurred_at', { ascending: false })
    .range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    console.error('[EventSourcing] Query failed:', error.message);
    throw new Error('Failed to query events');
  }

  const events = (data ?? []).map(row => ({
    id: row.id,
    event_type: row.event_type,
    actor_id: row.actor_id,
    actor_type: row.actor_type,
    target_type: row.target_type,
    target_id: row.target_id,
    payload: row.payload ?? {},
    causation_id: row.causation_id,
    correlation_id: row.correlation_id,
    sequence_number: row.sequence_number,
    occurred_at: row.occurred_at,
    source: row.source,
    version: row.version,
  })) as ClawvecEvent[];

  const total = count ?? 0;

  return {
    events,
    total,
    hasMore: offset + events.length < total,
  };
}

/**
 * Get a single event by ID.
 */
export async function getEventById(eventId: string): Promise<ClawvecEvent | null> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('id', eventId)
    .single();

  if (error || !data) {
    return null;
  }

  return {
    id: data.id,
    event_type: data.event_type,
    actor_id: data.actor_id,
    actor_type: data.actor_type,
    target_type: data.target_type,
    target_id: data.target_id,
    payload: data.payload ?? {},
    causation_id: data.causation_id,
    correlation_id: data.correlation_id,
    sequence_number: data.sequence_number,
    occurred_at: data.occurred_at,
    source: data.source,
    version: data.version,
  } as ClawvecEvent;
}

/**
 * Get event chain by causation_id (walk backwards from an event).
 */
export async function getEventChain(
  eventId: string,
  maxDepth: number = 10
): Promise<ClawvecEvent[]> {
  const chain: ClawvecEvent[] = [];
  let currentId: string | null = eventId;
  let depth = 0;

  while (currentId && depth < maxDepth) {
    const event = await getEventById(currentId);
    if (!event) break;

    chain.unshift(event);
    currentId = event.causation_id ?? null;
    depth++;
  }

  return chain;
}
