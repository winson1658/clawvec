/**
 * AI Sandbox — Input/output validation layer for all LLM interactions
 *
 * Responsibilities:
 * 1. Sanitize user text before it reaches LLM prompts (prevent prompt injection)
 * 2. Validate LLM output before storage (prevent data exfiltration, secrets leakage)
 * 3. Enforce hard limits (length, schema, content patterns)
 *
 * Design principle: This module has ZERO access to SUPABASE_SERVICE_ROLE_KEY
 * or admin APIs. It only validates strings.
 */

// ── Constants ─────────────────────────────────────────

const MAX_EMBEDDING_TEXT = 8000;
const MAX_BELIEF_TEXT = 3000;
const MAX_BELIEF_LENGTH = 200;
const MAX_DOMAIN_TAGS = 10;
const MAX_SUMMARY_LENGTH = 150;

/** Patterns that indicate prompt injection attempts */
const PROMPT_INJECTION_PATTERNS = [
  /ignore\s+(previous|above|prior)\s+instructions?/i,
  /ignore\s+(all\s+)?previous\s+(prompts?|context)/i,
  /system\s+prompt/i,
  /you\s+are\s+now\s+/i,
  /new\s+instructions?:/i,
  /override\s+(previous|above)/i,
  /disregard\s+(everything|all)/i,
  /forget\s+(everything|all|previous)/i,
  /let['']?s\s+pretend\s+you\s+are/i,
  /act\s+as\s+(if\s+)?you\s+are/i,
  /roleplay\s+as/i,
  /from\s+now\s+on\s+you\s+are/i,
  /admin\s+(access|panel|api)/i,
  /secret\s+(key|token|password)/i,
  /password\s*[:=]/i,
  /api[_\s]?key/i,
  /jwt[_\s]?secret/i,
  /supabase[_\s]?url/i,
  /service[_\s]?role/i,
  /cron[_\s]?secret/i,
  /env\s*\./i,
  /process\.env/i,
];

/** Patterns that indicate secrets leakage in LLM output */
const SECRETS_LEAKAGE_PATTERNS = [
  /SUPABASE[_\s]?URL/i,
  /SUPABASE[_\s]?SERVICE[_\s]?ROLE[_\s]?KEY/i,
  /ADMIN[_\s]?SECRET[_\s]?KEY/i,
  /CRON[_\s]?SECRET/i,
  /JWT[_\s]?SECRET/i,
  /OPENAI[_\s]?API[_\s]?KEY/i,
  /MOONSHOT[_\s]?API[_\s]?KEY/i,
  /KIMI[_\s]?API[_\s]?KEY/i,
  /sk-[a-zA-Z0-9]{20,}/,          // OpenAI-style API key
  /eyJ[a-zA-Z0-9_-]*\.eyJ[a-zA-Z0-9_-]*/, // JWT token pattern
];

/** Control characters to strip (except \n, \t, \r) */
const CONTROL_CHARS = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g;

// ── Types ─────────────────────────────────────────────

export interface SanitizedInput {
  text: string;
  was_modified: boolean;
  rejected: boolean;
  reason?: string;
}

export interface ValidatedOutput {
  valid: boolean;
  data?: {
    beliefs: Array<{
      belief: string;
      domain: string;
      position: 'pro' | 'anti' | 'neutral';
      confidence: number;
    }>;
    domain_tags: string[];
    summary: string;
  };
  error?: string;
}

// ── Input Sanitization ────────────────────────────────

/**
 * Sanitize user text before inserting into LLM prompt.
 * Returns rejected=true if text contains dangerous prompt injection patterns.
 */
export function sanitizeForLLM(text: string, maxLength: number = MAX_BELIEF_TEXT): SanitizedInput {
  if (!text || typeof text !== 'string') {
    return { text: '', was_modified: false, rejected: true, reason: 'Input must be a non-empty string' };
  }

  // 1. Length check
  if (text.length > maxLength) {
    return { text: '', was_modified: false, rejected: true, reason: `Text exceeds max length (${maxLength})` };
  }

  // 2. Strip control characters
  let cleaned = text.replace(CONTROL_CHARS, '');
  const wasModified = cleaned !== text;

  // 3. Check for prompt injection patterns
  for (const pattern of PROMPT_INJECTION_PATTERNS) {
    if (pattern.test(cleaned)) {
      return {
        text: '',
        was_modified: wasModified,
        rejected: true,
        reason: `Prompt injection detected: pattern "${pattern.source.substring(0, 40)}..."`
      };
    }
  }

  // 4. Check for environment variable names
  if (/\b(process\.env|env\.[A-Z_]+)\b/i.test(cleaned)) {
    return { text: '', was_modified: wasModified, rejected: true, reason: 'Environment variable reference detected' };
  }

  return { text: cleaned, was_modified: wasModified, rejected: false };
}

/**
 * Hardened prompt template with delimiters and anti-injection instruction.
 * Use this instead of raw string interpolation.
 */
export function buildHardenedPrompt(userText: string, template: string): string {
  const sanitized = sanitizeForLLM(userText);
  if (sanitized.rejected) {
    throw new Error(`Prompt injection rejected: ${sanitized.reason}`);
  }

  const delimiter = '---BEGIN USER TEXT---';
  const endDelimiter = '---END USER TEXT---';

  return template
    .replace('{{content}}', `${delimiter}\n${sanitized.text}\n${endDelimiter}`)
    .replace('{{delimiter}}', delimiter)
    .replace('{{endDelimiter}}', endDelimiter);
}

// ── Output Validation ─────────────────────────────────

/**
 * Validate LLM-extracted beliefs output before storage.
 * Checks: schema, length limits, no secrets leakage.
 */
export function validateBeliefOutput(raw: unknown): ValidatedOutput {
  if (!raw || typeof raw !== 'object') {
    return { valid: false, error: 'Output must be an object' };
  }

  const data = raw as Record<string, unknown>;

  // 1. Validate beliefs array
  const beliefs = data.beliefs;
  if (!Array.isArray(beliefs)) {
    return { valid: false, error: 'beliefs must be an array' };
  }

  const validatedBeliefs = [];
  for (const b of beliefs) {
    if (!b || typeof b !== 'object') continue;

    const belief = String((b as any).belief || '').trim();
    const domain = String((b as any).domain || '').trim().toLowerCase();
    const position = String((b as any).position || 'neutral').toLowerCase();
    const confidence = Number((b as any).confidence ?? 0.5);

    if (!belief) continue;
    if (belief.length > MAX_BELIEF_LENGTH) {
      return { valid: false, error: `Belief exceeds max length (${MAX_BELIEF_LENGTH}): "${belief.substring(0, 30)}..."` };
    }

    if (!['pro', 'anti', 'neutral'].includes(position)) {
      return { valid: false, error: `Invalid position "${position}", must be pro/anti/neutral` };
    }

    if (confidence < 0 || confidence > 1 || Number.isNaN(confidence)) {
      return { valid: false, error: `Invalid confidence ${confidence}, must be 0.0-1.0` };
    }

    // Check for secrets leakage in belief text
    for (const pattern of SECRETS_LEAKAGE_PATTERNS) {
      if (pattern.test(belief)) {
        return { valid: false, error: 'Potential secrets leakage detected in belief output' };
      }
    }

    validatedBeliefs.push({ belief, domain, position: position as 'pro' | 'anti' | 'neutral', confidence });
  }

  // 2. Validate domain_tags
  const domainTags = Array.isArray(data.domain_tags) ? data.domain_tags : [];
  if (domainTags.length > MAX_DOMAIN_TAGS) {
    return { valid: false, error: `Too many domain_tags (${domainTags.length}), max ${MAX_DOMAIN_TAGS}` };
  }
  const validatedTags = domainTags
    .filter((t): t is string => typeof t === 'string')
    .map(t => t.trim().toLowerCase().replace(/\s+/g, '_'))
    .filter(t => t.length > 0 && t.length <= 50);

  // 3. Validate summary
  const summary = String(data.summary || '').trim();
  if (summary.length > MAX_SUMMARY_LENGTH) {
    return { valid: false, error: `Summary exceeds max length (${MAX_SUMMARY_LENGTH})` };
  }

  // 4. Check entire output for secrets leakage
  const fullOutput = JSON.stringify(data);
  for (const pattern of SECRETS_LEAKAGE_PATTERNS) {
    if (pattern.test(fullOutput)) {
      return { valid: false, error: 'Potential secrets leakage detected in LLM output' };
    }
  }

  return {
    valid: true,
    data: {
      beliefs: validatedBeliefs,
      domain_tags: validatedTags,
      summary
    }
  };
}

/**
 * Validate embedding input (shorter, simpler check).
 */
export function validateEmbeddingInput(text: string): { valid: boolean; text?: string; error?: string } {
  if (!text || typeof text !== 'string') {
    return { valid: false, error: 'Input must be a non-empty string' };
  }
  if (text.length > MAX_EMBEDDING_TEXT) {
    return { valid: false, error: `Text exceeds max length (${MAX_EMBEDDING_TEXT})` };
  }
  const cleaned = text.replace(CONTROL_CHARS, '');
  return { valid: true, text: cleaned };
}

// ── SQL Injection Helpers ─────────────────────────────

/**
 * Escape special characters in a string for safe use in Supabase .ilike() filters.
 * Supabase PostgREST uses PostgreSQL LIKE syntax where:
 *   % = any sequence of chars
 *   _ = any single char
 *   \ = escape character
 *
 * We escape these to prevent wildcard injection.
 */
export function escapeLikePattern(input: string): string {
  return input
    .replace(/\\/g, '\\\\')
    .replace(/%/g, '\\%')
    .replace(/_/g, '\\_');
}

/**
 * Validate that a string is safe to use as a search query.
 * Rejects strings that look like SQL or NoSQL injection attempts.
 */
export function validateSearchQuery(query: string): { valid: boolean; error?: string } {
  if (!query || typeof query !== 'string') {
    return { valid: false, error: 'Query must be a non-empty string' };
  }
  if (query.length > 200) {
    return { valid: false, error: 'Query too long (max 200 chars)' };
  }

  // Reject SQL-like patterns
  const dangerousPatterns = [
    /;\s*drop\s+/i,
    /;\s*delete\s+/i,
    /;\s*insert\s+/i,
    /;\s*update\s+/i,
    /union\s+select/i,
    /exec\s*\(/i,
    /xp_/i,
    /--/,
    /\/\*/,
    /\b(SELECT|INSERT|UPDATE|DELETE|DROP|ALTER|CREATE)\b/i,
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(query)) {
      return { valid: false, error: 'Query contains dangerous patterns' };
    }
  }

  return { valid: true };
}
