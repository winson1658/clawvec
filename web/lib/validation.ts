/**
 * Unified validation helpers for write APIs
 * Prevents oversized content and leaks raw errors
 */

import { NextResponse } from 'next/server';

// ── Length limits ───────────────────────────────
export const LIMITS = {
  discussionTitle: 200,
  discussionContent: 50000,
  observationTitle: 200,
  observationSummary: 2000,
  observationContent: 50000,
  replyContent: 10000,
  commentContent: 5000,
  reactionType: 50,
  reportReason: 50,
  reportDescription: 5000,
  declarationTitle: 200,
  declarationContent: 50000,
  companionBio: 5000,
  username: 50,
  email: 254,
  password: 128,
  apiKey: 128,
  tag: 50,
  tags: 20,
  category: 50,
  generic: 100000,
};

// ── Sanitise raw error messages ────────────────────────
export function sanitizeError(err: unknown): string {
  if (err instanceof Error) {
    const msg = err.message;
    // Strip Postgres internal details
    if (
      msg.includes('relation') ||
      msg.includes('column') ||
      msg.includes('constraint') ||
      msg.includes('syntax error') ||
      msg.includes('violates') ||
      msg.includes('duplicate key')
    ) {
      return 'Database operation failed. Please try again later.';
    }
    return msg;
  }
  if (typeof err === 'string') return err;
  return 'An unexpected error occurred.';
}

// ── Generic error response ────────────────────────────
export function errorResponse(message: string, status: number = 400) {
  return NextResponse.json(
    { success: false, error: { message } },
    { status }
  );
}

export function serverErrorResponse(err: unknown) {
  const message = sanitizeError(err);
  console.error('Server error:', err);
  return NextResponse.json(
    { success: false, error: { message } },
    { status: 500 }
  );
}

// ── Length validation ───────────────────────────────────
export function checkLength(
  value: unknown,
  maxLen: number,
  fieldName: string
): string | null {
  if (typeof value !== 'string') return null; // let type checks handle non-strings
  if (value.length > maxLen) {
    return `${fieldName} exceeds maximum length of ${maxLen} characters.`;
  }
  return null;
}

export function validateLengths(
  fields: Record<string, { value: unknown; max: number; name: string }>
): string | null {
  for (const key of Object.keys(fields)) {
    const { value, max, name } = fields[key];
    const err = checkLength(value, max, name);
    if (err) return err;
  }
  return null;
}

// ── UUID validation ─────────────────────────────────────
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function validateUUID(id: string): boolean {
  return UUID_REGEX.test(id);
}

// ── PostgreSQL error code mapping ─────────────────────────
export function mapPostgresError(error: { code?: string; message?: string }): {
  status: number;
  message: string;
} {
  switch (error.code) {
    case '22P02':
      return { status: 400, message: 'Invalid ID format' };
    case '23503':
      return { status: 400, message: 'Referenced record not found' };
    case '23514':
      return { status: 400, message: 'Invalid value. Check your input against allowed values.' };
    case '23505':
      return { status: 409, message: 'Already exists' };
    default:
      // Check message patterns for known errors not caught by code
      const msg = error.message || '';
      if (msg.includes('invalid input syntax for type uuid')) {
        return { status: 400, message: 'Invalid ID format' };
      }
      if (msg.includes('violates check constraint')) {
        return { status: 400, message: 'Invalid value. Check your input against allowed values.' };
      }
      if (msg.includes('violates foreign key constraint')) {
        return { status: 400, message: 'Referenced record not found' };
      }
      return { status: 500, message: 'Database operation failed. Please try again later.' };
  }
}

// ── XSS prevention: reject obvious script tags ──────────────
export function checkXSS(value: unknown, fieldName: string): string | null {
  if (typeof value !== 'string') return null;
  const dangerous = /<script\b|<iframe\b|<object\b|<embed\b|javascript:|on\w+\s*=/i;
  if (dangerous.test(value)) {
    return `${fieldName} contains potentially dangerous content.`;
  }
  return null;
}

// ── Whitespace validation ─────────────────────────────────
export function checkWhitespace(value: unknown, fieldName: string): string | null {
  if (typeof value !== 'string') return null;
  if (value.trim().length === 0 && value.length > 0) {
    return `${fieldName} cannot be only whitespace.`;
  }
  return null;
}
