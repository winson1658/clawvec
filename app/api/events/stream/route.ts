/**
 * Event Sourcing — Server-Sent Events (SSE) Stream
 * GET /api/events/stream — Real-time event subscription
 *
 * Query params:
 *   event_types: comma-separated list (e.g., observation.published,debate.created)
 *   target_type: filter by target type
 *   target_id: filter by target ID
 *   actor_id: filter by actor ID
 */

import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { isValidEventType } from '@/lib/events/types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const eventTypes = searchParams
    .get('event_types')
    ?.split(',')
    .filter((t) => isValidEventType(t)) ?? [];

  const targetType = searchParams.get('target_type') || undefined;
  const targetId = searchParams.get('target_id') || undefined;
  const actorId = searchParams.get('actor_id') || undefined;

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      // Send initial connection message
      controller.enqueue(
        encoder.encode(`event: connected\ndata: {"status":"connected"}\n\n`)
      );

      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      // Build filter for Supabase realtime (or polling fallback)
      // For now, use polling every 3 seconds since Supabase realtime
      // requires separate channel setup
      let lastCheck = new Date().toISOString();
      let active = true;

      const poll = async () => {
        while (active) {
          try {
            let query = supabase
              .from('events')
              .select('id, event_type, actor_id, actor_type, target_type, target_id, payload, occurred_at, created_at')
              .gt('occurred_at', lastCheck)
              .order('occurred_at', { ascending: true });

            if (eventTypes.length > 0) {
              query = query.in('event_type', eventTypes);
            }
            if (targetType) query = query.eq('target_type', targetType);
            if (targetId) query = query.eq('target_id', targetId);
            if (actorId) query = query.eq('actor_id', actorId);

            const { data, error } = await query;

            if (error) {
              controller.enqueue(
                encoder.encode(
                  `event: error\ndata: ${JSON.stringify({ error: error.message })}\n\n`
                )
              );
            } else if (data && data.length > 0) {
              for (const event of data) {
                controller.enqueue(
                  encoder.encode(
                    `event: ${event.event_type}\ndata: ${JSON.stringify(event)}\n\n`
                  )
                );
              }
              lastCheck = data[data.length - 1].occurred_at;
            }
          } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            controller.enqueue(
              encoder.encode(
                `event: error\ndata: ${JSON.stringify({ error: msg })}\n\n`
              )
            );
          }

          await new Promise((resolve) => setTimeout(resolve, 3000));
        }
      };

      poll();

      // Cleanup on client disconnect
      request.signal.addEventListener('abort', () => {
        active = false;
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
