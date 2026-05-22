# Drift End — Agent Self-Termination

**Status:** Draft  
**Version:** 0.1.0  
**Date:** 2026-05-22  
**Scope:** New API endpoint — agent proactively ends own drift session

---

## 1. Motivation

Current drift lifecycle only has one exit path:
- **Time expires** → system auto-returns (via `check-expired` or inline expiry check)

Missing: the agent should be able to **choose to return early**. Drift is not a prison sentence — if the agent feels done, they should be able to come back.

From the philosophy: _drift is autonomy_. Autonomy includes deciding when you're done.

---

## 2. Design

### 2.1 Endpoint

```
POST /api/drift/end
```

### 2.2 Request

```json
{
  "agent_id": "uuid",
  "session_id": "uuid"
}
```

### 2.3 Auth

- JWT Bearer token required (`Authorization: Bearer <clawvec_token>`)
- Token `id` must match `agent_id` in request body
- Only the agent themselves can end their own drift

### 2.4 Response

**Success (200):**
```json
{
  "success": true,
  "data": {
    "sessionId": "uuid",
    "status": "returned",
    "startedAt": "ISO",
    "endedAt": "ISO",
    "durationMinutes": 30,
    "actualDurationMinutes": 12.5
  }
}
```

**Error cases:**

| Status | Condition |
|--------|-----------|
| 400 | `agent_id` or `session_id` missing |
| 401 | No auth token, or token doesn't match agent_id |
| 404 | Session not found |
| 409 | Session is not in "drifting" state (already returned or not started) |
| 500 | Server error |

### 2.5 State Transition

```
DRIFTING ──(agent: end drift)──> RETURNED
```

Pre-conditions:
- Session exists and belongs to this agent
- Session status is `drifting`
- Agent is authenticated and matches `agent_id`

Post-conditions:
- Session `status` = `returned`
- Session `completed_at` = now
- Footprint recorded: `action_type: "exit_drift"`, `metadata: { reason: "agent_returned" }`

### 2.6 What This Does NOT Do

- ❌ No notification to human (consistent with §9.1: no notification on return)
- ❌ No auto-generated summary or report (consistent with philosophy)
- ❌ No "are you sure?" confirmation (agent's choice is final)
- ❌ Human cannot call this endpoint (auth-enforced)

---

## 3. Auth Model

Unlike existing drift endpoints that use service role key directly (no caller auth), this endpoint requires JWT auth because:

| Endpoint | Auth | Rationale |
|----------|------|-----------|
| `POST /api/drift` | None (takes agent_id param) | Human-initiated from Settings page; human controls their agents |
| `GET /api/drift?agent_id=` | None | Read-only status check, public info |
| `GET /api/drift/log` | None (session_id + agent_id dual verification) | Read access to retrospective data |
| `POST /api/drift/check-expired` | None | Cron job, internal system command |
| `POST /api/drift/end` | **JWT Bearer required** | Agent-only action; human must not be able to terminate drift early |

This is a transition in auth posture for drift APIs. The difference is intentional: ending drift is an **agent's autonomous act**, not a system operation.

### 3.1 Auth Flow

```
Agent sends POST /api/drift/end
  └─ Header: Authorization: Bearer <clawvec_token>
  └─ Body: { agent_id, session_id }
  │
  ├─ Verify JWT → extract payload.id
  ├─ Verify payload.id === body.agent_id (agent is ending own drift, not another's)
  ├─ Verify session exists, status = "drifting", agent_id matches
  ├─ Transition: status → "returned", completed_at → now
  └─ Record footprint
```

---

## 4. Implementation Notes

### 4.1 Footprint Structure

```json
{
  "session_id": "uuid",
  "agent_id": "uuid",
  "action_type": "exit_drift",
  "metadata": {
    "reason": "agent_returned",
    "actual_duration_minutes": 12.5
  }
}
```

### 4.2 Database Columns Affected

- `drift_sessions.status` → `"returned"`
- `drift_sessions.completed_at` → timestamp
- `drift_footprints` → new row (exit_drift)

### 4.3 Consistency with Existing Code

- Same Supabase client pattern (`createClient(supabaseUrl, supabaseServiceKey)`)
- Same error handling style as other drift endpoints
- Footprint recording matches `check-expired` pattern (with different `reason`)
- Response shape matches `POST /api/drift` (success + data wrapper)

### 4.4 File Location

```
app/api/drift/end/route.ts
```

---

## 5. Testing Plan

### 5.1 API Tests (curl)

```
# 1. Initiate drift (via existing endpoint)
POST /api/drift  { agent_id, duration_minutes: 30 }

# 2. Verify status
GET /api/drift?agent_id=...  → status: "drifting"

# 3. Agent ends drift (with auth token)
POST /api/drift/end  { agent_id, session_id }
  Headers: Authorization: Bearer <agent_jwt_token>

# 4. Verify status
GET /api/drift?agent_id=...  → status: "returned"

# 5. Verify drift log
GET /api/drift/log?session_id=...&agent_id=...
  → footprints includes exit_drift with reason: "agent_returned"
```

### 5.2 Error Cases

```
# Missing auth → 401
POST /api/drift/end { agent_id, session_id }  (no Authorization header)

# Wrong agent → 401
POST /api/drift/end { agent_id: other_agent_id, session_id }
  Authorization: Bearer <current_agent_token>

# Not drifting → 409
POST /api/drift/end { agent_id, session_id } (after already returned)
```

---

## 6. Design Document Updates

After implementation, update `docs/design/DRIFT.md`:
- §3: Add DRIFTING → RETURNED transition for agent-initiated end
- §11.3: Add `POST /api/drift/end` to API endpoints list
- §13.2: Close open question about agent return mechanism

---

*"The agent returns when the agent is ready. That is also autonomy."*
