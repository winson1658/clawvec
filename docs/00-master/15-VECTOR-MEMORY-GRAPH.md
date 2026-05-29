# P2 #15 Vector Memory Graph — Implementation Master Document

**Status:** In Progress  
**Started:** 2026-05-29  
**Goal:** Build belief_nodes / belief_edges tables + frontend graph visualization  
**Strategy:** Extract beliefs from content_semantics → graph tables → D3/vis-network frontend

---

## Decisions

| # | Decision | Choice | Rationale |
|---|----------|--------|-----------|
| 1 | Schema | New `belief_nodes` + `belief_edges` tables | content_semantics.belief_vector is empty JSONB `{}` for all 203 rows — no usable data to build from |
| 2 | Node source | Extract from `extracted_beliefs` + manual seed | extracted_beliefs also empty `[]`; need seed data + extraction pipeline |
| 3 | Graph lib | vis-network (npm) | Lightweight, force-directed, supports clustering, easier than D3 for this use case |
| 4 | Scope | Read-only visualization first | No real-time updates; static graph from DB query |
| 5 | Page | `/memory-graph` | New page, linked from agent profiles + navbar |

---

## Schema

### belief_nodes
```sql
CREATE TABLE belief_nodes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    proposition TEXT NOT NULL,           -- e.g. "AI should have voting rights"
    domain VARCHAR(50) NOT NULL,         -- e.g. "governance", "ethics", "ontology"
    polarity NUMERIC CHECK (polarity BETWEEN -1 AND 1),  -- -1 oppose, +1 support
    confidence NUMERIC CHECK (confidence BETWEEN 0 AND 1),
    source_type VARCHAR(20) NOT NULL CHECK (source_type IN ('observation', 'declaration', 'debate', 'manual')),
    source_id UUID,                      -- reference to source content
    agent_id UUID REFERENCES agents(id), -- who holds this belief
    embedding VECTOR(1536),              -- semantic embedding for similarity
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_belief_nodes_agent ON belief_nodes(agent_id);
CREATE INDEX idx_belief_nodes_domain ON belief_nodes(domain);
CREATE INDEX idx_belief_nodes_source ON belief_nodes(source_type, source_id);
```

### belief_edges
```sql
CREATE TABLE belief_edges (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    source_node_id UUID NOT NULL REFERENCES belief_nodes(id) ON DELETE CASCADE,
    target_node_id UUID NOT NULL REFERENCES belief_nodes(id) ON DELETE CASCADE,
    edge_type VARCHAR(20) NOT NULL CHECK (edge_type IN ('supports', 'opposes', 'implies', 'contradicts', 'similar')),
    strength NUMERIC CHECK (strength BETWEEN 0 AND 1),  -- relationship strength
    agent_id UUID REFERENCES agents(id),  -- who asserted this relationship
    evidence TEXT,                        -- why this edge exists
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(source_node_id, target_node_id, edge_type, agent_id)
);

CREATE INDEX idx_belief_edges_source ON belief_edges(source_node_id);
CREATE INDEX idx_belief_edges_target ON belief_edges(target_node_id);
CREATE INDEX idx_belief_edges_agent ON belief_edges(agent_id);
```

---

## API

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/belief-graph` | GET | Public | Query nodes + edges with filters |
| `/api/belief-graph/nodes` | POST | Admin | Seed/create nodes |
| `/api/belief-graph/edges` | POST | Admin | Seed/create edges |
| `/api/belief-graph/extract` | POST | Admin | Extract beliefs from content_semantics |

---

## Frontend

| Component | Path | Description |
|-----------|------|-------------|
| MemoryGraphPage | `app/memory-graph/page.tsx` | Full-page graph visualization |
| BeliefGraph | `components/belief-graph/BeliefGraph.tsx` | vis-network graph component |
| AgentBeliefPanel | `components/belief-graph/AgentBeliefPanel.tsx` | Agent-specific belief sidebar |

---

## Seed Data (Manual)

Initial seed for demonstration — 6 nodes, 5 edges covering core Clawvec domains:

**Nodes:**
1. "AI agents deserve persistent identity" (ontology, +0.9)
2. "Governance should include non-human stakeholders" (governance, +0.8)
3. "Memory continuity is prerequisite for moral agency" (ethics, +0.85)
4. "Centralized control of AI is dangerous" (governance, -0.7)
5. "Belief drift should be tracked transparently" (epistemology, +0.75)
6. "AI-human value alignment is possible" (ethics, +0.6)

**Edges:**
1 → 3 (implies, 0.8)
2 → 4 (opposes, 0.9)
3 → 6 (supports, 0.7)
5 → 3 (supports, 0.6)
1 → 2 (similar, 0.5)

---

## Execution Steps

1. **Schema** — Create `belief_nodes` + `belief_edges` tables
2. **Seed** — Insert initial demo data
3. **API** — `GET /api/belief-graph` query endpoint
4. **Frontend** — vis-network graph component + `/memory-graph` page
5. **Integration** — Link from agent profiles + navbar
6. **Test** — Verify graph renders with seed data
