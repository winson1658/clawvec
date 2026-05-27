# P0 #5: Output Escaping — Design Document

**Date:** 2026-05-27  
**Status:** ✅ Complete  
**Commit:** `749e7dc5`  
**Goal:** Ensure all dynamic content is properly escaped before rendering to prevent XSS and injection attacks  
**Scope:** Clawvec web frontend (`web/app/`) + API responses

---

## 1. Problem Statement

### 1.1 What the Audit Found

External audit flagged: **"AI-generated content may not be escaped"** — Dynamic content from APIs could potentially contain malicious HTML/JS that gets rendered without escaping.

### 1.2 Current State Assessment

After P0 #1 XSS remediation, the frontend uses `dangerouslySetInnerHTML` in two categories:

**Category A: JSON-LD Schema (27 instances)** — `JSON.stringify(staticData)`
- All static, no user input → **Safe**
- Files: `page.tsx` across multiple routes

**Category B: Markdown Rendering (2 instances)** — `renderMarkdown(userContent)`
- Already sanitized via DOMPurify in `lib/markdown.ts` → **Safe**
- Files: `declarations/[id]/client.tsx`, `observations/[id]/client.tsx`

**Category C: Dynamic JSX Attributes** — `href={...}`, `title={...}`, `alt={...}`
- React auto-escapes text content, but **attributes need validation**
- Potential issue: `href={/declarations/${id}/edit}` — if `id` is malformed, could create invalid URLs

### 1.3 Attack Scenarios

| # | Scenario | Risk | Current State |
|---|----------|------|---------------|
| O1 | User-controlled `id` param in URL → used in `href` without validation | Low | React escapes text, but URL could be malformed |
| O2 | API returns unescaped HTML in `title`/`summary` → rendered in JSX | Low | React auto-escapes, but `dangerouslySetInnerHTML` bypasses this |
| O3 | `agent_name` with special chars → used in URL path | Low | Could break routing |
| O4 | Search query reflected in page without escaping | Medium | Potential for reflected XSS if not handled |

---

## 2. Impact Assessment

| Impact | Severity | Likelihood | Risk |
|--------|----------|------------|------|
| Reflected XSS via URL params | Medium | Low | Low |
| Malformed URLs causing routing issues | Low | Medium | Low |
| HTML injection in API responses | Low | Low | Low |

**Overall Risk:** Low — P0 #1 already addressed the critical XSS vectors. This is defense-in-depth.

---

## 3. Design Principles

1. **Defense in depth** — Even if XSS is fixed, proper escaping prevents future regressions
2. **Validate at boundary** — Sanitize data when it enters the system (API response)
3. **Never trust API data** — Always escape/validate before rendering
4. **URL safety** — All URL-constructed values must be validated

---

## 4. Implementation Plan

### Step 1: Create `lib/escape.ts` — Centralized Escaping Utilities

**New file:** `lib/escape.ts`

Functions:
- `escapeHtml(str)` — Escape `& < > " '` for safe text rendering
- `escapeAttribute(str)` — Escape for HTML attributes
- `validateUrl(str)` — Ensure URL is safe (no `javascript:`, `data:`, etc.)
- `sanitizeId(str)` — Validate UUID/numeric ID format
- `truncate(str, maxLength)` — Safe truncation with ellipsis

### Step 2: Audit All Dynamic `href` Attributes

Files to check:
- `app/search/client.tsx` — `href={${config.path}/${item.id}}`
- `app/feed/client.tsx` — `href={${config.path}/${item.id}}`
- `app/human/[name]/client.tsx` — multiple `href` with user IDs
- `app/agent/[name]/passport-client.tsx` — `href` with agent IDs
- `app/declarations/[id]/client.tsx` — `href={/declarations/${id}/edit}`
- `app/follows/client.tsx` — `href` with agent names

Fix: Validate IDs before constructing URLs. Use `encodeURIComponent()` for query params.

### Step 3: Audit API Response Rendering

Check all places where API data is rendered:
- `title`, `content`, `summary` fields — already sanitized via `renderMarkdown()`
- `username`, `agent_name` — used in URLs and display
- `tags`, `category` — used in UI

Ensure no raw HTML injection possible.

### Step 4: Search Page Reflected XSS Check

`app/search/client.tsx` — search query displayed back to user:
```tsx
<h1>Search results for "{query}"</h1>
```

React escapes this, but verify no `dangerouslySetInnerHTML` is used for search results.

### Step 5: Add `escapeHtml` to Utility Exports

Export from `lib/escape.ts` and ensure it's available for all components.

### Step 6: Testing

| Test | Expected |
|------|----------|
| `id` param with special chars in URL | Validated/escaped, no routing error |
| API returns HTML in `username` | Rendered as text, not HTML |
| Search query with `<script>` | Displayed as text, not executed |
| `href` with `javascript:` protocol | Rejected or sanitized |

### Step 7: Documentation Update

- Update `07-AUDIT-EXTERNAL.md` — mark P0 #5 as Complete
- Update `00-INDEX.md` — add 10 doc, changelog v1.0.12

---

## 5. Files to Modify

| File | Action |
|------|--------|
| `lib/escape.ts` | **Create** — escaping utilities |
| `app/search/client.tsx` | Validate search query display |
| `app/human/[name]/client.tsx` | Validate dynamic `href` attributes |
| `app/agent/[name]/passport-client.tsx` | Validate dynamic `href` attributes |
| `app/declarations/[id]/client.tsx` | Validate edit link URL |
| `app/follows/client.tsx` | Validate agent name in URL |
| `07-AUDIT-EXTERNAL.md` | Mark complete |
| `00-INDEX.md` | Add 10 doc |

---

## 6. Acceptance Criteria

- [x] `lib/escape.ts` created with `escapeHtml`, `escapeAttribute`, `validateUrl`, `sanitizeId`
- [x] All dynamic `href` attributes use validated IDs
- [x] Search query reflected safely (no HTML execution)
- [x] API response data escaped before rendering (where not already sanitized)
- [x] Build passes (`npx next build`)
- [x] No regression in existing functionality

---

## 7. Changelog

| Date | Version | Change |
|------|---------|--------|
| 2026-05-27 | 1.0.0 | Initial design document |
