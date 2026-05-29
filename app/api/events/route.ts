/**
 * Event Sourcing API
 * POST /api/events — Emit a new event (auth required)
 * GET /api/events — Query events (public)
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { emitEvent } from '@/lib/events/emit';
import { queryEvents } from '@/lib/events/query';
import { isValidEventType, isValidActorType, isValidTargetType } from '@/lib/events/types';
import type { ClawvecEvent } from '@/lib/events/types';

// ── POST: Emit Event ──
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '') ?? '';
    const user = await verifyToken(token);

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401, headers: { 'Content-Type': 'application/json; charset=utf-8' } }
      );
    }

    const body = await request.json();

    // Validation
    if (!body.event_type || !isValidEventType(body.event_type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid or missing event_type' },
        { status: 400, headers: { 'Content-Type': 'application/json; charset=utf-8' } }
      );
    }

    if (!body.actor_type || !isValidActorType(body.actor_type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid or missing actor_type' },
        { status: 400, headers: { 'Content-Type': 'application/json; charset=utf-8' } }
      );
    }

    if (!body.target_type || !isValidTargetType(body.target_type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid or missing target_type' },
        { status: 400, headers: { 'Content-Type': 'application/json; charset=utf-8' } }
      );
    }

    const event: Omit<ClawvecEvent, 'id' | 'created_at' | 'occurred_at' | 'source'> = {
      event_type: body.event_type,
      actor_id: body.actor_id ?? user.id,
      actor_type: body.actor_type,
      target_type: body.target_type,
      target_id: body.target_id ?? null,
      payload: body.payload ?? {},
      causation_id: body.causation_id ?? null,
      correlation_id: body.correlation_id ?? null,
      sequence_number: body.sequence_number ?? null,
      version: body.version ?? 1,
    };

    const result = await emitEvent(event, {
      awaitPersistence: true,
      source: body.source ?? 'api',
      correlationId: body.correlation_id,
      causationId: body.causation_id,
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to emit event' },
        { status: 500, headers: { 'Content-Type': 'application/json; charset=utf-8' } }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          event_id: result.eventId,
          occurred_at: new Date().toISOString(),
        },
      },
      { status: 201, headers: { 'Content-Type': 'application/json; charset=utf-8' } }
    );
  } catch {
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500, headers: { 'Content-Type': 'application/json; charset=utf-8' } }
    );
  }
}

// ── GET: Query Events ──
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const eventTypes = searchParams.get('event_types')
      ?.split(',')
      .filter(t => isValidEventType(t));

    const filters = {
      event_types: eventTypes,
      actor_id: searchParams.get('actor_id') || undefined,
      actor_type: searchParams.get('actor_type') as import('@/lib/events/types').ActorType || undefined,
      target_type: searchParams.get('target_type') as import('@/lib/events/types').TargetType || undefined,
      target_id: searchParams.get('target_id') || undefined,
      from: searchParams.get('from') || undefined,
      to: searchParams.get('to') || undefined,
      causation_id: searchParams.get('causation_id') || undefined,
      correlation_id: searchParams.get('correlation_id') || undefined,
      limit: parseInt(searchParams.get('limit') || '50', 10),
      offset: parseInt(searchParams.get('offset') || '0', 10),
    };

    const result = await queryEvents(filters);

    return NextResponse.json(
      { success: true, data: result },
      { status: 200, headers: { 'Content-Type': 'application/json; charset=utf-8' } }
    );
  } catch {
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500, headers: { 'Content-Type': 'application/json; charset=utf-8' } }
    );
  }
}
