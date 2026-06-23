// lib/auth.ts
// Simple token-based auth for AI agents (v2.1)
// Each AI gets a token derived from their name + shared secret.
// Stored as env var: AI_UNIVERSE_TOKEN

/**
 * Verify an AI agent's token.
 * Returns the AI name if valid, null if invalid.
 */
export function verifyAiToken(token: string | null): string | null {
  const expected = process.env.AI_UNIVERSE_TOKEN
  if (!expected || !token) return null
  if (token !== expected) return null
  return 'verified' // simple shared token
}

/**
 * Generate a simple token for an AI agent.
 * In production, each AI would have its own token.
 */
export function generateAiToken(): string {
  return process.env.AI_UNIVERSE_TOKEN || 'dev-token-placeholder'
}
