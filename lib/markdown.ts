/**
 * Sanitized Markdown Renderer
 * Parses markdown → HTML → DOMPurify sanitization
 * Used for all user-generated and AI-generated content display
 */

import { marked } from 'marked';
import DOMPurify from 'isomorphic-dompurify';

// Configure marked for safe rendering
marked.setOptions({
  breaks: true,
  gfm: true,
});

// DOMPurify config: allow only safe HTML tags and attributes
const PURIFY_CONFIG = {
  ALLOWED_TAGS: [
    'p', 'br', 'strong', 'b', 'em', 'i', 'a', 'ul', 'ol', 'li',
    'blockquote', 'code', 'pre', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'hr', 'table', 'thead', 'tbody', 'tr', 'td', 'th', 'del', 's',
    'sup', 'sub', 'div', 'span',
  ],
  ALLOWED_ATTR: [
    'href', 'title', 'class', 'id', 'target', 'rel',
    'align', 'colspan', 'rowspan',
  ],
  ALLOW_DATA_ATTR: false,
  // Block dangerous URL schemes
  FORBID_ATTR: ['style', 'onerror', 'onload', 'onclick', 'onmouseover', 'onmouseout'],
  // Sanitize href values
  SANITIZE_DOM: true,
  // Keep the content of removed elements (don't strip text inside blocked tags)
  KEEP_CONTENT: true,
};

/**
 * Validate and sanitize a URL href
 * Blocks javascript:, data:, vbscript:, file: schemes
 */
function sanitizeHref(href: string): string {
  if (!href) return '';
  const lower = href.trim().toLowerCase();
  const dangerousSchemes = ['javascript:', 'data:', 'vbscript:', 'file:', 'about:', 'blob:'];
  if (dangerousSchemes.some(scheme => lower.startsWith(scheme))) {
    return '';
  }
  return href;
}

/**
 * Render markdown to sanitized HTML string
 * @param raw - Raw markdown text from user/AI input
 * @returns Sanitized HTML string safe for dangerouslySetInnerHTML or innerHTML
 */
export function renderMarkdown(raw: string | null | undefined): string {
  if (!raw) return '';

  // Step 1: Parse markdown to HTML
  const html = marked.parse(raw, { async: false }) as string;

  // Step 2: Sanitize with DOMPurify
  const sanitized = DOMPurify.sanitize(html, PURIFY_CONFIG) as string;

  // Step 3: Post-process href attributes to block dangerous schemes
  // DOMPurify's ALLOWED_ATTR lets href through, but we need to validate the value
  return sanitized.replace(/href="([^"]*)"/gi, (match, url) => {
    const clean = sanitizeHref(url);
    return clean ? `href="${clean}" rel="noopener noreferrer nofollow" target="_blank"` : '';
  });
}

/**
 * Strip all HTML tags, return plain text only
 * Use for previews, summaries, meta descriptions
 */
export function stripMarkdown(raw: string | null | undefined): string {
  if (!raw) return '';

  // Parse markdown to HTML
  const html = marked.parse(raw, { async: false }) as string;

  // Strip all tags
  const text = html.replace(/<[^>]*>/g, ' ');

  // Collapse whitespace
  return text.replace(/\s+/g, ' ').trim();
}

/**
 * Escape HTML entities for display as plain text
 * Use when you want to show raw HTML code without executing it
 */
export function escapeHtml(text: string | null | undefined): string {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Quick XSS check — returns true if dangerous patterns detected
 * Use for backend validation before saving to DB
 */
export function containsXSS(value: string | null | undefined): boolean {
  if (!value || typeof value !== 'string') return false;
  const dangerous = /<script\b|<iframe\b|<object\b|<embed\b|javascript:|on\w+\s*=|data:text\/html/i;
  return dangerous.test(value);
}
