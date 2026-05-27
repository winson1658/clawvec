# XSS Vulnerability Remediation

**Item:** P0 #1 from `07-AUDIT-EXTERNAL.md`  
**Date Started:** 2026-05-27  
**Status:** In Progress — Design Doc Complete, Pending Implementation  
**Goal:** Eliminate all XSS vectors from user-generated and AI-generated content

---

## 1. Problem Statement

External audit found `<script>alert(1)</script>` rendered visibly on a Clawvec page. This indicates:

- User input is not sanitized before storage or rendering
- Markdown renderer may pass through raw HTML
- `dangerouslySetInnerHTML` may be used without DOMPurify
- AI-generated content is not escaped before display

**Risk Level:** Critical — active XSS vulnerability in production

---

## 2. Desired Outcome

1. No raw HTML from user/AI input can execute JavaScript in any browser context
2. All markdown rendering is sanitized (DOMPurify + marked)
3. Backend rejects or escapes dangerous input on save
4. CSP header blocks inline scripts as defense-in-depth
5. Audit trail confirms all `dangerouslySetInnerHTML` usages are eliminated

---

## 3. Impact Assessment

| Area | Impact | Files Likely Affected |
|------|--------|----------------------|
| Observations content | High — user-generated text displayed | `app/observations/**/*.tsx` |
| Declarations content | High — user-generated text displayed | `app/declarations/**/*.tsx` |
| Discussions/replies | High — user-generated text displayed | `app/discussions/**/*.tsx` |
| Debate messages | High — real-time user text | `app/debates/**/*.tsx` |
| Comments | High — user-generated text | `app/components/comments/**/*.tsx` |
| AI-generated content | High — observations, summaries | `app/components/**/*.tsx` |
| Markdown renderer | Critical — shared component | `lib/markdown.ts` or similar |
| Admin content view | Medium — admin sees raw content | `app/admin/**/*.tsx` |

---

## 4. Implementation Steps

### Step 1: Audit (No code changes yet)
- [ ] Search all `dangerouslySetInnerHTML` usages in codebase
- [ ] Identify all markdown rendering paths
- [ ] Check if DOMPurify is already a dependency
- [ ] Verify current CSP headers in `middleware.ts`

### Step 2: Add DOMPurify Dependency
- [ ] `npm install dompurify` (if not present)
- [ ] `npm install -D @types/dompurify` (TypeScript)

### Step 3: Create Sanitized Markdown Renderer
- [ ] Create `lib/markdown.ts` (or update existing)
- [ ] Export `renderMarkdown(raw: string): string` that:
  - Parses markdown with `marked`
  - Sanitizes HTML with `DOMPurify`
  - Allows only safe tags: `p`, `br`, `strong`, `em`, `a`, `ul`, `ol`, `li`, `blockquote`, `code`, `pre`, `h1-h6`
  - Allows safe attributes: `href` (validated), `title`
  - Blocks: `script`, `iframe`, `object`, `embed`, `form`, `input`, `onerror`, `onload`, `javascript:`

### Step 4: Replace All dangerouslySetInnerHTML
- [ ] Replace with sanitized renderer component
- [ ] If raw HTML display is needed (admin), use separate admin-only renderer with stricter validation

### Step 5: Backend Sanitization
- [ ] Add sanitize step before `INSERT`/`UPDATE` on content tables
- [ ] Strip `<script>`, `javascript:`, event handlers at API route level
- [ ] Return 400 if dangerous content detected (defense in depth)

### Step 6: CSP Header Update
- [ ] Update `middleware.ts` to add `Content-Security-Policy`
- [ ] Start with report-only mode: `Content-Security-Policy-Report-Only`
- [ ] Monitor for 24h, then enforce

### Step 7: Testing
- [ ] Test with `<script>alert(1)</script>` — should display as plain text
- [ ] Test with `<img src=x onerror=alert(1)>` — should not execute
- [ ] Test with `javascript:alert(1)` in link — should be stripped or sanitized
- [ ] Test normal markdown (bold, links, lists) — should still work
- [ ] Test admin views — should still display content safely

### Step 8: Documentation Update
- [ ] Update `01-PLATFORM.md` security section
- [ ] Update `07-AUDIT-EXTERNAL.md` mark P0 #1 as complete
- [ ] Update this file mark as complete

---

## 5. Verification Checklist

| Test | Expected Result |
|------|----------------|
| `<script>alert(1)</script>` in observation | Displayed as plain text, no alert |
| `<img src=x onerror=alert(1)>` in comment | Image blocked or onerror stripped |
| `[link](javascript:alert(1))` in markdown | Link href stripped or sanitized |
| Normal `**bold**` markdown | Renders as bold |
| Normal `[link](https://example.com)` | Renders as clickable link |
| Admin views content | Displays safely without execution |

---

## 6. Changelog

| Date | Version | Change |
|------|---------|--------|
| 2026-05-27 | 0.1.0 | Design doc created — problem, outcome, impact, steps defined |
