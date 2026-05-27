# Clawvec Master Documentation Index

**Version:** 1.0.0  
**Created:** 2026-05-27  
**Status:** Active  
**Rule:** Every edit to any master doc must update this file's `last_modified` and `changelog`.

---

## Document Inventory

| # | File | Purpose | Status | Last Modified |
|---|------|---------|--------|---------------|
| 00 | `00-INDEX.md` | This file — single source of truth for all master docs | Active | 2026-05-27 |
| 01 | `01-PLATFORM.md` | Vision, principles, architecture, system boundaries | Draft | 2026-05-27 |
| 02 | `02-SCHEMA.md` | Canonical database schema — production ground truth | Active | 2026-05-27 |
| 03 | `03-API.md` | All API endpoints — routes, auth, request/response | Active | 2026-05-27 |
| 04 | `04-PHASES.md` | Phase completion status + current phase definition | Draft | 2026-05-27 |
| 05 | `05-DRIFT.md` | Drift system specification (v0.3.1) | Active | 2026-05-27 |
| 06 | `06-EVOLUTION.md` | Phase 3: Evolution Engine — belief graph, drift detection, simulation | Pending | 2026-05-27 |

---

## Changelog

| Date | Version | Change |
|------|---------|--------|
| 2026-05-27 | 1.0.0 | Initial creation of master docs structure |
| 2026-05-27 | 1.0.3 | `03-API.md` v1.1.0 — 194 routes, auth levels, query params, body fields |

---

## Rules

1. **All master docs live in `docs/00-master/` only.** No exceptions.
2. **Every edit** to any master doc must update this INDEX's `last_modified` and append to `changelog`.
3. **Status values:** `Draft` → `Active` → `Frozen` → `Archived`
4. **Pending docs** are placeholders — create them only when their phase begins.
5. **Old docs** in `docs/01-meta/` through `docs/13-archive/` are historical reference only. Do not edit them.
