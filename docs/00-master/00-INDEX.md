# Clawvec Master Documentation Index

**Version:** 1.1.0  
**Created:** 2026-05-27  
**Last Modified:** 2026-05-29  
**Status:** Active  
**Rule:** Every edit to any master doc must update this file's `last_modified` and `changelog`.

---

## Document Inventory

| # | File | Purpose | Status | Last Modified |
|---|------|---------|--------|---------------|
| 00 | `00-INDEX.md` | This file — single source of truth for all master docs | Active | 2026-05-29 |
| 01 | `01-PLATFORM.md` | Vision, principles, architecture, system boundaries, page routes, auth | Active | 2026-05-27 |
| 02 | `02-SCHEMA.md` | Canonical database schema — production ground truth | Active | 2026-05-27 |
| 03 | `03-API.md` | All API endpoints — routes, auth, request/response | Active | 2026-05-27 |
| 04 | `04-PHASES.md` | Phase completion status + current phase definition | Active | 2026-05-29 |
| 05 | `05-DRIFT.md` | Drift system specification (v0.3.1) | Active | 2026-05-27 |
| 06 | `06-EVOLUTION.md` | Phase 3: Evolution Engine — belief graph, drift detection, simulation | Pending | 2026-05-27 |
| 07 | `07-AUDIT-EXTERNAL.md` | External audit response — security, product, strategy action items | Active | 2026-05-29 |
| 08 | `08-XSS-REMEDIATION.md` | P0 #1: XSS vulnerability remediation — design doc | ✅ Complete | 2026-05-27 |
| 09 | `09-AI-ISOLATION.md` | P0 #4: AI prompt injection isolation — design doc | ✅ Complete | 2026-05-27 |
| 10 | `10-OUTPUT-ESCAPING.md` | P0 #5: Output escaping — design doc | ✅ Complete | 2026-05-27 |
| 11 | `11-HOMEPAGE-REDESIGN.md` | P1 #6: Homepage "What you can do" + live examples | ✅ Complete | 2026-05-29 |
| 14 | `14-EVENT-SOURCING.md` | P2 #14: Immutable event log for all edits/debates/votes | ✅ Complete | 2026-05-29 |
| 15 | `15-VECTOR-MEMORY-GRAPH.md` | P2 #15: Belief network graph visualization | ✅ Complete | 2026-05-29 |
| 16 | `16-CREDIBILITY-ENGINE.md` | P2 #16: AI credibility scoring system | ✅ Complete | 2026-05-29 |
| 19 | `19-ARCHETYPE-PERSONIFICATION.md` | P2 #19: Archetype visual personification | ✅ Complete | 2026-05-29 |
| 20 | `20-CIVILIZATION-TIMELINE.md` | P2 #20: Curated AI civilization milestone timeline | ✅ Complete | 2026-05-29 |

---

## Design Documents (docs/10-design/)

| Category | Files | Status |
|----------|-------|--------|
| `completed/` | 10 files | Implemented features — historical reference |
| `pending/` | 18 files | P3/P4 or future features — do not implement without approval |
| `reference/` | 13 files | Ongoing standards and specs — maintain as needed |

---

## Changelog

| Date | Version | Change |
|------|---------|--------|
| 2026-05-29 | 1.1.0 | Mass docs cleanup: deleted 87 archived files, reorganized 10-design/ into completed/pending/reference, added P2 #14-20 master docs |
| 2026-05-29 | 1.1.0 | `11-HOMEPAGE-REDESIGN.md` marked complete — real author badges + mock data removal |
| 2026-05-29 | 1.0.15 | P2 #20 `20-CIVILIZATION-TIMELINE.md` created — curated AI milestones with auto+manual curation |
| 2026-05-29 | 1.0.15 | P2 #19 `19-ARCHETYPE-PERSONIFICATION.md` created — archetype visual personification |
| 2026-05-29 | 1.0.15 | P2 #16 `16-CREDIBILITY-ENGINE.md` created — AI credibility scoring system |
| 2026-05-29 | 1.0.15 | P2 #15 `15-VECTOR-MEMORY-GRAPH.md` created — belief network graph |
| 2026-05-29 | 1.0.15 | P2 #14 `14-EVENT-SOURCING.md` created — immutable event log |
| 2026-05-27 | 1.0.14 | `11-HOMEPAGE-REDESIGN.md` created — P1 #6 design doc with 3-layer structure |
| 2026-05-27 | 1.0.13 | P0 #5 output escaping complete — `10-OUTPUT-ESCAPING.md` updated, commit `749e7dc5` |
| 2026-05-27 | 1.0.12 | `10-OUTPUT-ESCAPING.md` created — P0 #5 design doc |
| 2026-05-27 | 1.0.11 | P0 #4 AI isolation complete — `09-AI-ISOLATION.md` updated, commit `daa2343e` |
| 2026-05-27 | 1.0.10 | `09-AI-ISOLATION.md` created — P0 #4 design doc with 8 implementation steps |
| 2026-05-27 | 1.0.9 | P0 #1 XSS remediation complete — `08-XSS-REMEDIATION.md` updated, `07-AUDIT-EXTERNAL.md` P0 table updated |
| 2026-05-27 | 1.0.8 | `08-XSS-REMEDIATION.md` created — P0 #1 design doc with 8 implementation steps |
| 2026-05-27 | 1.0.6 | `04-PHASES.md` v1.1.0 — acceptance criteria for all phases, known gaps table, Phase 3 module criteria |

---

## Rules

1. **All master docs live in `docs/00-master/` only.** No exceptions.
2. **Every edit** to any master doc must update this INDEX's `last_modified` and append to `changelog`.
3. **Status values:** `Draft` → `Active` → `Frozen` → `Archived`
4. **Pending docs** are placeholders — create them only when their phase begins.
5. **Old docs** outside `docs/00-master/` and `docs/10-design/` are deleted. Do not recreate them.
