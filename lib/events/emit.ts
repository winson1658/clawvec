/**
 * Event Sourcing — Emit Utility
 * Fire-and-forget event persistence to the immutable event log.
 * This is NON-BLOCKING: the main write succeeds even if event emission fails.
 */

import { createClient } from '@supabase/supabase-js';
import type { ClawvecEvent, EventType, ActorType, TargetType } from './types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

function getSupabase() {
  return createClient(supabaseUrl, supabaseServiceKey);
}

interface EmitOptions {
  /** If true, await event persistence. Default: false (fire-and-forget) */
  awaitPersistence?: boolean;
  /** Correlation ID for grouping related events */
  correlationId?: string;
  /** Causation ID — which event directly caused this one */
  causationId?: string;
  /** Event source */
  source?: ClawvecEvent['source'];
  /** Override occurred_at timestamp */
  occurredAt?: string;
}

/**
 * Emit an event to the immutable event log.
 *
 * Usage:
 *   await emitEvent({
 *     event_type: 'observation.published',
 *     actor_id: agentId,
 *     actor_type: 'agent',
 *     target_type: 'observation',
 *     target_id: observationId,
 *     payload: { title, summary, belief_vector },
 *   });
 *
 * The event is written asynchronously (fire-and-forget) by default.
 * Set `awaitPersistence: true` if you need to confirm it was written.
 */
export async function emitEvent(
  event: Omit<ClawvecEvent, 'id' | 'created_at' | 'occurred_at' | 'source' | 'causation_id' | 'correlation_id'>,
  options: EmitOptions = {}
): Promise<{ success: boolean; eventId?: string; error?: string }> {
  const {
    awaitPersistence = false,
    correlationId,
    causationId,
    source = 'api',
    occurredAt,
  } = options;

  const payload: Record<string, unknown> = {
    event_type: event.event_type,
    actor_id: event.actor_id ?? null,
    actor_type: event.actor_type,
    target_type: event.target_type,
    target_id: event.target_id ?? null,
    payload: event.payload ?? {},
    source,
    version: event.version ?? 1,
    occurred_at: occurredAt ?? new Date().toISOString(),
  };

  if (correlationId) payload.correlation_id = correlationId;
  if (causationId) payload.causation_id = causationId;
  if (event.sequence_number != null) payload.sequence_number = event.sequence_number;

  const doInsert = async () => {
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('events')
        .insert(payload)
        .select('id')
        .single();

      if (error) {
        console.error('[EventSourcing] Failed to emit event:', error.message, { event_type: event.event_type });
        return { success: false, error: error.message };
      }

      return { success: true, eventId: data?.id };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[EventSourcing] Exception during emit:', msg, { event_type: event.event_type });
      return { success: false, error: msg };
    }
  };

  if (awaitPersistence) {
    return doInsert();
  }

  // Fire-and-forget: don't block the caller
  doInsert().catch(() => {
    // Already logged in doInsert
  });

  return { success: true };
}

/**
 * Convenience: emit multiple events in a batch.
 * All events share the same correlation_id.
 */
export async function emitEvents(
  events: Omit<ClawvecEvent, 'id' | 'created_at' | 'occurred_at' | 'source' | 'correlation_id'>[],
  options: Omit<EmitOptions, 'correlationId' | 'causationId'> & { correlationId?: string } = {}
): Promise<{ success: boolean; results: { eventId?: string; error?: string }[] }> {
  const correlationId = options.correlationId ?? crypto.randomUUID();
  const results: { eventId?: string; error?: string }[] = [];

  for (let i = 0; i < events.length; i++) {
    const event = events[i];
    const causationId = i > 0 ? results[i - 1]?.eventId : undefined;

    const result = await emitEvent(event, {
      ...options,
      correlationId,
      causationId,
      awaitPersistence: true,
    });

    results.push({ eventId: result.eventId, error: result.error });
  }

  const allSuccess = results.every(r => !r.error);
  return { success: allSuccess, results };
}
