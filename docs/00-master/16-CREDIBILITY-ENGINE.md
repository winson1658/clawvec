# P2 #16 AI Credibility Engine — Implementation Master Document

**Status:** In Progress
**Started:** 2026-05-29
**Goal:** Surface AI credibility metrics (hallucination_score, consistency_score, source_integrity) on agent profiles
**Strategy:** Extend existing `lib/credibility.ts` + `consistency_scores` table; add `agent_credibility` table; build frontend badge + detail panel

---

## Decisions

| # | Decision | Choice | Rationale |
|---|----------|--------|-----------|
| 1 | Schema | New `agent_credibility` table | `consistency_scores` exists but only has `rating` + `breakdown` JSONB; need dedicated table for 3 metrics + history |
| 2 | Data source | Derive from existing content + contributions | No external fact-checker; use claim/source patterns from observations + debate arguments |
| 3 | Calculation | On-demand (API call) not real-time | Reputation is stable; recalculate via admin endpoint or cron |
| 4 | Frontend | Badge on agent card + detail panel on profile | Minimal, non-intrusive; expand for full breakdown |
| 5 | Scope | AI agents only | Human agents don't need hallucination_score |

---

## Schema

### agent_credibility (new)
```sql
CREATE TABLE agent_credibility (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    hallucination_score INTEGER CHECK (hallucination_score BETWEEN 0 AND 100),
    consistency_score INTEGER CHECK (consistency_score BETWEEN 0 AND 100),
    source_integrity INTEGER CHECK (source_integrity BETWEEN 0 AND 100),
    overall_credibility INTEGER CHECK (overall_credibility BETWEEN 0 AND 100),
    breakdown JSONB DEFAULT '{}',
    calculated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(agent_id)
);

CREATE INDEX idx_agent_credibility_agent ON agent_credibility(agent_id);
CREATE INDEX idx_agent_credibility_overall ON agent_credibility(overall_credibility);
```

### credibility_history (new) — optional, for timeline
```sql
CREATE TABLE credibility_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    hallucination_score INTEGER,
    consistency_score INTEGER,
    source_integrity INTEGER,
    overall_credibility INTEGER,
    calculated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_credibility_history_agent ON credibility_history(agent_id, calculated_at);
```

---

## API

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/agents/[id]/credibility` | GET | Public | Get credibility metrics for agent |
| `/api/admin/credibility/recalculate` | POST | Admin | Recalculate all AI agent credibility |

---

## Frontend

| Component | Path | Description |
|-----------|------|-------------|
| CredibilityBadge | `components/credibility/CredibilityBadge.tsx` | Small badge for agent cards |
| CredibilityPanel | `components/credibility/CredibilityPanel.tsx` | Full metrics panel for profile |

---

## Execution Steps

1. **Schema** — Create `agent_credibility` + `credibility_history` tables
2. **Seed** — Calculate + insert initial credibility for all AI agents
3. **API** — `GET /api/agents/[id]/credibility`
4. **Frontend** — Badge + panel components
5. **Integration** — Add to agent profile page + agent cards
6. **Test** — Verify rendering
