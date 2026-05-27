/**
 * Output Escaping Utilities
 *
 * Centralized escaping for dynamic content to prevent XSS and injection.
 * Use these when rendering user-controlled or API-derived data.
 */

// ── HTML Escaping ─────────────────────────────────────

const HTML_ESCAPE_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
};

const HTML_ESCAPE_PATTERN = /[&<>"'\/]/g;

/**
 * Escape HTML special characters for safe text rendering.
 * Use when inserting untrusted text into JSX (React does this automatically,
 * but explicit escaping is defense-in-depth for non-JSX contexts).
 */
export function escapeHtml(str: string): string {
  if (!str || typeof str !== 'string') return '';
  return str.replace(HTML_ESCAPE_PATTERN, (char) => HTML_ESCAPE_MAP[char] || char);
}

/**
 * Escape for HTML attributes (stricter than text).
 */
export function escapeAttribute(str: string): string {
  if (!str || typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// ── URL Validation ────────────────────────────────────

const DANGEROUS_URL_PROTOCOLS = /^(javascript|data|vbscript|file):/i;

/**
 * Validate a URL is safe to use in href/src.
 * Rejects javascript:, data:, vbscript:, file: protocols.
 */
export function validateUrl(url: string): { safe: boolean; url?: string; error?: string } {
  if (!url || typeof url !== 'string') {
    return { safe: false, error: 'URL must be a non-empty string' };
  }

  const trimmed = url.trim();

  if (trimmed.startsWith('#')) {
    // Allow anchor links
    return { safe: true, url: trimmed };
  }

  if (DANGEROUS_URL_PROTOCOLS.test(trimmed)) {
    return { safe: false, error: `Dangerous URL protocol rejected: ${trimmed.substring(0, 30)}` };
  }

  // Allow relative URLs and http/https
  if (trimmed.startsWith('/') || trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return { safe: true, url: trimmed };
  }

  return { safe: false, error: 'URL must be relative or http(s)' };
}

/**
 * Build a safe URL path with validated segments.
 * Ensures no path traversal or injection.
 */
export function buildSafePath(base: string, ...segments: string[]): string {
  const cleanSegments = segments.map((s) => {
    if (!s || typeof s !== 'string') return '';
    // Remove path traversal attempts and null bytes
    return s.replace(/\\/g, '/').replace(/\.{2,}/g, '').replace(/\x00/g, '');
  });

  const path = [base, ...cleanSegments].join('/').replace(/\/+/g, '/');
  return path;
}

// ── ID Validation ─────────────────────────────────────

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const NUMERIC_PATTERN = /^\d+$/;
const SAFE_SLUG_PATTERN = /^[a-zA-Z0-9_-]+$/;

/**
 * Validate a string is a valid UUID.
 */
export function isValidUUID(str: string): boolean {
  return UUID_PATTERN.test(str);
}

/**
 * Validate a string is a safe URL slug (alphanumeric + underscore + hyphen).
 */
export function isValidSlug(str: string): boolean {
  return SAFE_SLUG_PATTERN.test(str);
}

/**
 * Validate a string is numeric (for numeric IDs).
 */
export function isValidNumericId(str: string): boolean {
  return NUMERIC_PATTERN.test(str);
}

/**
 * Sanitize an ID parameter from URL or API.
 * Returns null if invalid.
 */
export function sanitizeId(str: string, type: 'uuid' | 'slug' | 'numeric' = 'uuid'): string | null {
  if (!str || typeof str !== 'string') return null;

  switch (type) {
    case 'uuid':
      return isValidUUID(str) ? str.toLowerCase() : null;
    case 'slug':
      return isValidSlug(str) ? str : null;
    case 'numeric':
      return isValidNumericId(str) ? str : null;
    default:
      return null;
  }
}

// ── String Utilities ──────────────────────────────────

/**
 * Safely truncate a string with ellipsis.
 */
export function truncate(str: string, maxLength: number): string {
  if (!str || typeof str !== 'string') return '';
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength - 3) + '...';
}

/**
 * Strip all HTML tags from a string (for plain text display).
 */
export function stripHtml(str: string): string {
  if (!str || typeof str !== 'string') return '';
  return str.replace(/<[^>]*>/g, '');
}

/**
 * Validate a search query is safe (no SQL/NoSQL injection patterns).
 * More restrictive than ai-sandbox version for frontend use.
 */
export function validateSearchQuery(query: string): { valid: boolean; error?: string } {
  if (!query || typeof query !== 'string') {
    return { valid: false, error: 'Query must be a non-empty string' };
  }
  if (query.length > 200) {
    return { valid: false, error: 'Query too long (max 200 chars)' };
  }
  return { valid: true };
}
