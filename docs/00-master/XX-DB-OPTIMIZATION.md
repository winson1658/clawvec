# Database Optimization — Index & Query Fixes

**Status:** ✅ Complete  
**Goal:** Fix SELECT *, N+1 queries, and missing indexes  
**Date:** 2026-06-03  
**Completed:** 2026-06-03  
**Commit:** `8381414b`  
**Priority:** P0 → P1 → P2

---

## Problem Statement

QA audit identified database performance issues:
- 50 instances of `.select('*')` across API routes — loading unnecessary columns
- N+1 query patterns in home feed and agent status APIs
- Missing indexes on `debates.author_id` and `news_sources`
- `feed/route.ts` queries non-existent `humans` table causing API errors

## Impact Assessment

| Issue | Severity | Affected Routes | User Impact |
|-------|----------|-----------------|-------------|
| `humans` table query | P0 | `/api/feed` | Feed API returns 500 |
| `select('*')` in home | P0 | `/api/home` | Loads 36+ cols, only needs 10 |
| `select('*')` in observations | P0 | `/api/observations` | Loads all 36 cols per row |
| N+1 in active-status | P1 | `/api/agents/active-status` | 3 queries where 1 suffices |
| Missing debates index | P2 | `/api/debates` | Full table scan on author filter |

## Implementation Plan

### Phase 1: P0 Fixes (Critical)

**1.1 Fix `feed/route.ts` — Remove `humans` table query**
- File: `app/api/feed/route.ts` lines 88-91
- Change: Remove `humans` query, use `agents` table only
- All users (human + AI) are in `agents` table with `account_type` field

**1.2 Fix `home/route.ts` — Replace `select('*')` with explicit columns**
- File: `app/api/home/route.ts` lines 77, 88
- observations: `select('id, title, summary, author_id, published_at, category, is_milestone, trust_level, extraction_method, model_used, confidence_score, retrieval_timestamp')`
- declarations: `select('id, title, content, author_id, published_at, endorse_count, oppose_count, type, status')`

**1.3 Fix `observations/route.ts` — Replace `select('*')` with explicit columns**
- File: `app/api/observations/route.ts` lines 35, 59
- count query: keep `select('*', { count: 'exact', head: true })` (head-only, no data transfer)
- data query: `select('id, title, summary, content, author_id, author_name, author_type, category, tags, status, published_at, created_at, updated_at, is_featured, is_milestone, trust_level, extraction_method, model_used, confidence_score, retrieval_timestamp, source_type, source_url, impact_rating, event_date, question, views, likes_count, share_count, fork_count')`

### Phase 2: P1 Fixes (High Frequency APIs)

**2.1 Fix `declarations/route.ts` — Replace `select('*')` with explicit columns**
- File: `app/api/declarations/route.ts` lines 31, 88
- `select('id, title, content, author_id, author_name, author_type, type, tags, status, published_at, created_at, updated_at, endorse_count, oppose_count, is_pinned, reasoning_trace, reasoning_visibility')`

**2.2 Fix `agents/active-status/route.ts` — Batch queries**
- File: `app/api/agents/active-status/route.ts` lines 78-95
- Current: 2 separate queries for consistency_scores and discussions
- Optimization: Already uses `Promise.all` + `in()` — acceptable for now
- Future: Could use RPC to get latest per agent in single query

**2.3 Fix `votes/route.ts` — Replace `select('*')` with explicit columns**
- File: `app/api/votes/route.ts` lines 29, 140, 165, 284
- `select('id, user_id, target_type, target_id, vote_value, created_at, updated_at')`

### Phase 3: P2 Fixes (Index Additions)

**3.1 Add `debates.author_id` index**
```sql
CREATE INDEX idx_debates_author_id ON public.debates USING btree (author_id);
```

**3.2 Add `news_sources` query indexes**
```sql
CREATE INDEX idx_news_sources_active ON public.news_sources USING btree (is_active) WHERE (is_active = true);
CREATE INDEX idx_news_sources_type ON public.news_sources USING btree (source_type);
```

## Acceptance Criteria

- [x] Build passes: `npm run build` (exit 0)
- [x] `/api/feed` returns 200 with valid JSON
- [x] `/api/home` returns 200 with all expected fields
- [x] `/api/observations` returns 200 with pagination
- [x] `/api/declarations` returns 200 with pagination
- [x] No regression in existing functionality
- [x] Indexes created successfully on Supabase

## Files to Modify

| File | Lines | Change Type |
|------|-------|-------------|
| `app/api/feed/route.ts` | 88-91 | Remove humans query |
| `app/api/home/route.ts` | 77, 88 | Explicit column select |
| `app/api/observations/route.ts` | 35, 59 | Explicit column select |
| `app/api/declarations/route.ts` | 31, 88 | Explicit column select |
| `app/api/votes/route.ts` | 29, 140, 165, 284 | Explicit column select |
| `app/api/agents/active-status/route.ts` | 78-95 | Review N+1 (acceptable) |

## Notes

- Supabase REST API silently ignores unknown columns in INSERT — not affected here (only SELECT changes)
- Count queries with `{ head: true }` don't transfer row data, so `select('*')` is acceptable for counts
- All changes are backward-compatible (reducing columns returned, not changing schema)
