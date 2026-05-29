/**
 * Standardized input validation helpers for API routes.
 * Prevents oversized payloads, null byte injection, and basic type attacks.
 */

export const LIMITS = {
  title: { min: 1, max: 500 },
  content: { min: 1, max: 50000 },
  username: { min: 2, max: 50 },
  email: { min: 5, max: 254 },
  password: { min: 6, max: 128 },
  tags: { max: 20 },
  tagLength: { max: 50 },
  url: { max: 2048 },
  name: { min: 1, max: 100 },
  description: { max: 2000 },
  jsonBody: { max: 100000 }, // 100KB max body
} as const;

export interface ValidationResult {
  valid: boolean;
  error?: string;
  field?: string;
}

/**
 * Check for null bytes (0x00) — common injection vector.
 */
export function containsNullByte(value: string): boolean {
  return value.includes('\x00');
}

/**
 * Validate string length.
 */
export function validateLength(
  value: string,
  min: number,
  max: number,
  field: string
): ValidationResult {
  if (typeof value !== 'string') {
    return { valid: false, error: `${field} must be a string`, field };
  }
  if (value.length < min) {
    return { valid: false, error: `${field} must be at least ${min} characters`, field };
  }
  if (value.length > max) {
    return { valid: false, error: `${field} must not exceed ${max} characters`, field };
  }
  if (containsNullByte(value)) {
    return { valid: false, error: `${field} contains invalid characters`, field };
  }
  return { valid: true };
}

/**
 * Validate email format (basic RFC 5322 subset).
 */
export function validateEmail(email: string): ValidationResult {
  const lengthCheck = validateLength(email, LIMITS.email.min, LIMITS.email.max, 'email');
  if (!lengthCheck.valid) return lengthCheck;

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { valid: false, error: 'Invalid email format', field: 'email' };
  }
  return { valid: true };
}

/**
 * Validate URL format.
 */
export function validateURL(url: string): ValidationResult {
  const lengthCheck = validateLength(url, 1, LIMITS.url.max, 'url');
  if (!lengthCheck.valid) return lengthCheck;

  try {
    new URL(url);
    return { valid: true };
  } catch {
    return { valid: false, error: 'Invalid URL format', field: 'url' };
  }
}

/**
 * Validate array of tags.
 */
export function validateTags(tags: unknown[]): ValidationResult {
  if (!Array.isArray(tags)) {
    return { valid: false, error: 'tags must be an array', field: 'tags' };
  }
  if (tags.length > LIMITS.tags.max) {
    return { valid: false, error: `tags must not exceed ${LIMITS.tags.max} items`, field: 'tags' };
  }
  for (const tag of tags) {
    if (typeof tag !== 'string') {
      return { valid: false, error: 'each tag must be a string', field: 'tags' };
    }
    if (tag.length > LIMITS.tagLength.max) {
      return { valid: false, error: `each tag must not exceed ${LIMITS.tagLength.max} characters`, field: 'tags' };
    }
    if (containsNullByte(tag)) {
      return { valid: false, error: 'tags contain invalid characters', field: 'tags' };
    }
  }
  return { valid: true };
}

/**
 * Validate JSON body size.
 */
export function validateBodySize(body: string): ValidationResult {
  const byteLength = new TextEncoder().encode(body).length;
  if (byteLength > LIMITS.jsonBody.max) {
    return {
      valid: false,
      error: `Request body too large. Max ${LIMITS.jsonBody.max} bytes allowed.`,
      field: 'body',
    };
  }
  return { valid: true };
}

/**
 * Sanitize user input: trim whitespace, collapse multiple spaces.
 */
export function sanitizeInput(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

/**
 * Map PostgreSQL errors to HTTP status codes.
 */
export function mapPostgresError(error: { code?: string; message?: string }): { status: number; message: string } {
  const code = error.code;
  const message = error.message || 'Database error';

  switch (code) {
    case '23505': // unique_violation
      return { status: 409, message: 'Resource already exists' };
    case '23503': // foreign_key_violation
      return { status: 400, message: 'Referenced resource does not exist' };
    case '23502': // not_null_violation
      return { status: 400, message: 'Required field is missing' };
    case 'PGRST103': // range not satisfiable
      return { status: 400, message: 'Invalid pagination range' };
    case 'PGRST116': // JWT expired
      return { status: 401, message: 'Authentication expired' };
    case 'PGRST301': // row-level security violation
      return { status: 403, message: 'Access denied' };
    case '42P01': // undefined_table
      return { status: 500, message: 'Internal server error' };
    default:
      return { status: 500, message: 'Internal server error' };
  }
}

/**
 * Legacy helpers for backward compatibility.
 */
export function validateUUID(value: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
}

export function checkWhitespace(value: string): boolean {
  return /^\s*$/.test(value);
}

export function validateLengths(body: Record<string, unknown>): ValidationResult {
  for (const [key, value] of Object.entries(body)) {
    if (typeof value === 'string') {
      const limit = LIMITS[key as keyof typeof LIMITS] as { min?: number; max?: number } | undefined;
      if (limit?.max && value.length > limit.max) {
        return { valid: false, error: `${key} exceeds maximum length`, field: key };
      }
    }
  }
  return { valid: true };
}

export function checkXSS(value: string): boolean {
  const xssPattern = /<(script|iframe|object|embed|form)|javascript:|on\w+\s*=|data:text\/html/i;
  return xssPattern.test(value);
}

export function errorResponse(message: string, status: number = 400): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}

export function serverErrorResponse(): Response {
  return errorResponse('Internal server error', 500);
}
