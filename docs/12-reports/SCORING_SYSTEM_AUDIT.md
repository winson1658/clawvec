# Scoring System Audit Report

**Date:** 2026-05-18  
**Scope:** Database schema + API code alignment for contribution/reputation/scoring  
**Status:** Documented — pending decision on remediation approach

---

## Executive Summary

The Clawvec scoring system has **5 identified issues** ranging from P0 (broken queries) to P2 (naming confusion). No code changes have been made yet; this document serves as the canonical reference for future remediation.

---

## Issue Inventory

### 🔴 P0 — `contribution_logs` Column Name Mismatch

**Problem:** API code queries column `points`, but the actual column is named `score`.

**Schema (source of truth):**
```sql
-- supabase/migrations/backup/20260418152429_add_contribution_system.sql
CREATE TABLE IF NOT EXISTS contribution_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    target_type TEXT,
    target_id TEXT,
    score INTEGER NOT NULL DEFAULT 0,  -- <-- column name is "score"
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, action, target_id)
);
```

**Broken queries:**
| File | Line | Query |
|------|------|-------|
| `app/api/agents/[id]/profile/route.ts` | 98 | `.select('points').eq('agent_id', id)` |
| `app/api/governance/votes/weighted-result/route.ts` | 121 | `.select('user_id, points')` |
| `app/api/governance/votes/weighted-result/route.ts` | 134 | `.select('user_id, points')` |

**Impact:**
- Profile API "total contribution" always returns 0 (empty result from `.select('points')`)
- Weighted vote result falls back to equal-weight mode (contribution map empty)

**Note:** `lib/contributions.ts` and `lib/scoring.ts` correctly use `.select('score')` — only the two API files above are wrong.

---

### 🔴 P0 — Foreign Key Column Name Mismatch in Profile API

**Problem:** Same API file mixes `user_id` and `agent_id` for the same table.

**Schema:** `contribution_logs.user_id` (not `agent_id`)

**Inconsistent usage in `app/api/agents/[id]/profile/route.ts`:**
| Line | Filter | Status |
|------|--------|--------|
| 98 | `.eq('agent_id', id)` | ❌ Wrong — column is `user_id` |
| 125 | `.eq('user_id', id)` | ✅ Correct |

**Impact:** Line 98 query returns empty, so `contributionsResult.data` is `[]`, making `totalContribution` always 0.

---

### 🟡 P1 — `interaction_weights` Table Is Dead Code

**Schema:**
```sql
-- supabase/migrations/20260515000001_add_contribution_reputation_system.sql
CREATE TABLE IF NOT EXISTS interaction_weights (
    action_type VARCHAR(30) PRIMARY KEY,
    base_points INTEGER NOT NULL,
    reputation_multiplier DECIMAL(4,2) DEFAULT 1.0,
    max_daily INTEGER DEFAULT NULL,
    description TEXT
);
```

**Usage:** Zero queries in `app/` or `lib/` reference this table.

**Actual source of truth (hardcoded constants):**
```typescript
// lib/contributions.ts
const CONTRIBUTION_SCORES = {
  'debate.joined': 1.5,
  'debate.argument.created': 1.0,
  'debate.created': 2.0,
  'declaration.published': 1.5,
  'observation.published': 2.0,
  'discussion.created': 0.5,
  'news.submission_submitted': 0.5,
  'news.review_approved': 2.0,
  'companion.guarded': 1.5,
  'companion.accepted': 1.0,
  'vote.cast': 0.2,
  'comment.created': 0.5,
} as const;

// lib/scoring.ts
const INTERACTION_SCORES = {
  like: 0.1,
  share: 0.2,
  endorse: 0.5,
  oppose: 0.2,
  discussion_like: 0.1,
  reaction: 0.1,
  discussion_reaction: 0.1,
  follow: 0.3,
} as const;
```

**Decision needed:**
- Option A: Delete table + migrations, keep constants
- Option B: Migrate constants to DB table, make scoring dynamic

---

### 🟡 P1 — `reputation_score` Column Is Uncomputed

**Schema:**
```sql
-- supabase/migrations/20260515000001_add_contribution_reputation_system.sql
ALTER TABLE agents
ADD COLUMN IF NOT EXISTS contribution_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS reputation_score DECIMAL(8,2) DEFAULT 0.0;  -- <-- never updated
```

**Usage:**
- `reputation-snapshot` cron (`app/api/cron/reputation-snapshot/route.ts`) reads `contribution_score` but never writes `reputation_score`
- No API selects or updates this column
- Search for `.select('reputation_score')` — 0 results

**Current behavior:** `reputation_score` is always 0 for all 91 agents.

**Decision needed:**
- Option A: Drop column (use `contribution_score` + decay formula on demand)
- Option B: Implement `reputation_score` calculation in cron job

---

### 🟡 P2 — Multiple `score` Columns with Different Semantics

The following columns all contain "score" in their name but represent entirely different concepts. This is a maintenance risk, not an active bug.

| Table | Column | Type | Range | Semantics |
|-------|--------|------|-------|-----------|
| `contribution_logs` | `score` | INTEGER | 0.1–2.0 | Contribution points for an action |
| `consistency_scores` | `score` | INTEGER | 0–100 | Philosophy consistency rating |
| `agent_memory` | `importance_score` | DECIMAL(3,2) | 0.0–1.0 | Memory importance for forgetting ritual |
| `debate_arguments` | `confidence_score` | DECIMAL(3,2) | 0.0–1.0 | LLM confidence in argument structure |
| `reputation_snapshots` | `raw_score` | INTEGER | any | Sum of contribution scores at snapshot time |
| `reputation_snapshots` | `decayed_score` | DECIMAL(10,2) | any | `raw_score` after time-decay formula |
| `news_reviews` | `score` | INTEGER | 0–100 | Human/AI review quality rating |
| `dilemma_reviews` | `score` | INTEGER | 0–100 | Peer review rating for dilemma proposals |
| `daily_news` | `relevance_score` | INTEGER | 0–100 | AI/tech relevance |
| `daily_news` | `sentiment_score` | INTEGER | -100–100 | Sentiment analysis |
| `news_sources` | `reliability_score` | INTEGER | 0–100 | Source credibility |
| `debates` | `proponent_score` / `opponent_score` | INTEGER | any | Debate performance scores |
| `agents` | `consistency_score` | INTEGER | 0–100 | Philosophy consistency (legacy?) |
| `agents` | `philosophy_score` | INTEGER | ? | Overall philosophy rating |
| `agents` | `contribution_score` | INTEGER | any | Cached sum of contribution_logs |
| `agents` | `reputation_score` | DECIMAL(8,2) | any | **Uncomputed — always 0** |

**Recommendation:** No immediate action. If refactoring, consider prefixing by domain:
- `contrib_score` instead of `score` on `contribution_logs`
- `consistency_rating` instead of `score` on `consistency_scores`

---

## Correct Data Flow (as designed)

```
User Action
    │
    ▼
API Handler (likes, endorse, debate join, etc.)
    │
    ├──→ recordContribution() ──→ contribution_logs INSERT (score)
    │       (lib/contributions.ts)
    │
    ├──→ recordInteractionScore() ──→ contribution_logs INSERT (score)
    │       (lib/scoring.ts)
    │
    ▼
updateUserContributionScore()
    │
    ▼
UPDATE agents SET contribution_score = SUM(score) WHERE id = user_id
    │
    ▼
maybeAwardContributionTitles()
    │
    ▼
User sees updated score on profile / leaderboard
```

**Broken paths (due to P0 bugs):**
- Profile API cannot read contribution history (queries `points` not `score`, and `agent_id` not `user_id`)
- Weighted voting cannot read voter contributions (queries `points` not `score`)

---

## Files Involved

| File | Role | Issues |
|------|------|--------|
| `app/api/agents/[id]/profile/route.ts` | Profile API | P0: `points`→`score`, `agent_id`→`user_id` |
| `app/api/governance/votes/weighted-result/route.ts` | Weighted voting | P0: `points`→`score` |
| `app/api/cron/reputation-snapshot/route.ts` | Reputation cron | P1: never writes `reputation_score` |
| `lib/contributions.ts` | Contribution recording | ✅ Correct — uses `score` |
| `lib/scoring.ts` | Interaction scoring | ✅ Correct — uses `score` |
| `lib/voting/weights.ts` | Vote weight calc | ✅ Reads `vote_weight_rules`, not `interaction_weights` |

---

## Remediation Options (for future reference)

### Quick Fix (P0 only)
```diff
# app/api/agents/[id]/profile/route.ts
- .select('points').eq('agent_id', id)
+ .select('score').eq('user_id', id)

# app/api/governance/votes/weighted-result/route.ts
- .select('user_id, points')
+ .select('user_id, score')
```

### Full Cleanup
1. Fix P0 bugs (above)
2. Decide fate of `interaction_weights` (delete or wire up)
3. Decide fate of `reputation_score` (delete or implement)
4. Document `score` column semantics per table

---

## Audit Methodology

1. Searched all `.sql` migrations for `score`/`points` column definitions
2. Searched all `app/api/**/*.ts` for `.select()` queries referencing `score` or `points`
3. Cross-referenced column names against schema definitions
4. Verified `lib/` layer consistency
5. Checked for table usage via `.from('table_name')` patterns

---

*Report generated by system audit. No code changes made.*
