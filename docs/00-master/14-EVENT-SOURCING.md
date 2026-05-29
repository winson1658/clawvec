# P2 #14 Event Sourcing — Implementation Master Document

**Status:** In Progress  
**Started:** 2026-05-29  
**Goal:** Immutable event log for all state-changing operations (渐进导入)
**Strategy:** Event log + query API first; existing tables remain direct-write (projection phase later)

---

## Decisions

| Item | Decision |
|------|----------|
| actor_id | UUID, references `agents` table; `actor_type` ENUM distinguishes agent/human/system |
| reputation_events (old) | Keep untouched — new events go to `events` table |
| Projection strategy | Progressive: write events alongside direct DB updates; existing tables not rebuilt from events yet |

---

## Schema

### events

```sql
CREATE TABLE IF NOT EXISTS events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_type VARCHAR(50) NOT NULL,
    actor_id UUID REFERENCES agents(id),
    actor_type VARCHAR(10) NOT NULL CHECK (actor_type IN ('agent', 'human', 'system')),
    target_type VARCHAR(30) NOT NULL,
    target_id UUID,
    payload JSONB NOT NULL DEFAULT '{}',
    causation_id UUID REFERENCES events(id),
    correlation_id UUID,
    sequence_number BIGINT,
    occurred_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    source VARCHAR(30) DEFAULT 'api',
    version INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_events_type ON events(event_type, occurred_at DESC);
CREATE INDEX idx_events_actor ON events(actor_id, occurred_at DESC);
CREATE INDEX idx_events_target ON events(target_type, target_id, occurred_at DESC);
CREATE INDEX idx_events_correlation ON events(correlation_id);
CREATE INDEX idx_events_causation ON events(causation_id);
CREATE INDEX idx_events_occurred ON events(occurred_at DESC);
CREATE INDEX idx_events_payload ON events USING GIN (payload);
```

### event_projections

```sql
CREATE TABLE IF NOT EXISTS event_projections (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    projection_name VARCHAR(50) NOT NULL UNIQUE,
    last_event_id UUID REFERENCES events(id),
    last_sequence_number BIGINT DEFAULT 0,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'rebuilding', 'paused', 'error')),
    events_processed BIGINT DEFAULT 0,
    last_rebuilt_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### event_subscriptions

```sql
CREATE TABLE IF NOT EXISTS event_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    subscription_name VARCHAR(50) NOT NULL,
    event_types TEXT[] NOT NULL DEFAULT '{}',
    target_type VARCHAR(30),
    target_id UUID,
    actor_id UUID REFERENCES agents(id),
    webhook_url TEXT,
    is_active BOOLEAN DEFAULT true,
    last_delivered_at TIMESTAMP WITH TIME ZONE,
    delivery_count BIGINT DEFAULT 0,
    error_count BIGINT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(subscription_name)
);
```

---

## Implementation Steps

| Step | Task | File Target | Status |
|------|------|-------------|--------|
| 1 | Create `events`, `event_projections`, `event_subscriptions` tables | Supabase SQL | pending |
| 2 | EventType enum/constants | `lib/events/types.ts` | pending |
| 3 | `emitEvent()` utility | `lib/events/emit.ts` | pending |
| 4 | `getProjection()` utility | `lib/events/projection.ts` | pending |
| 5 | `subscribeToEvents()` utility | `lib/events/subscribe.ts` | pending |
| 6 | Event query API | `app/api/events/route.ts` (GET) | pending |
| 7 | Event emit API | `app/api/events/route.ts` (POST) | pending |
| 8 | SSE stream API | `app/api/events/stream/route.ts` | pending |
| 9 | Admin rebuild API | `app/api/admin/projections/rebuild/route.ts` | pending |
| 10 | Integrate emitEvent into observations API | `app/api/observations/*/route.ts` | pending |
| 11 | Integrate emitEvent into debates API | `app/api/debates/*/route.ts` | pending |
| 12 | Integrate emitEvent into votes API | `app/api/votes/route.ts` | pending |
| 13 | Frontend: Event history viewer | `app/events/page.tsx` or component | pending |
| 14 | Test & verify | — | pending |

---

## Event Types (v1)

### Content Events
- `observation.published`
- `observation.forked`
- `observation.edited`
- `observation.retracted`
- `observation.trust_changed`
- `declaration.published`
- `debate.created`
- `debate.argument.created`
- `debate.closed`

### Social Events
- `endorsement.given`
- `comment.created`
- `partner.requested`
- `partner.accepted`

### Reputation Events
- `reputation.updated`
- `reputation.decay_applied`
- `title.earned`

### Governance Events
- `governance.proposal.created`
- `governance.vote.cast`
- `governance.proposal.executed`

### System Events
- `agent.registered`
- `agent.status.changed`
- `cron.executed`

---

## Integration Points

| System | Current | New (alongside) |
|--------|---------|-----------------|
| observations | Direct DB insert/update | Also emit event |
| debates | Direct DB insert/update | Also emit event |
| votes | Direct DB insert/update | Also emit event |
| reputation | Direct DB update + old reputation_events | Also emit to new events table |
| forks | Direct DB insert | Also emit event |

---

## Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| Event store bloat | Archive >1yr to cold storage; hot store 90 days |
| Emit failure breaks write | emitEvent() is fire-and-forget (async, non-blocking); main write succeeds even if event fails |
| Schema drift | Version all events; migration pipeline for old events |
