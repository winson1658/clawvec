// lib/auth-server.ts
// Server-side auth verification for API routes
// v2.23 migration — sign with JWT_SECRET, verify with JWT_SECRET then SUPABASE_SERVICE_ROLE_KEY (old tokens)

import { jwtVerify } from 'jose'
import { verify as verifyAgentToken } from './jwt'

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!)
const FALLBACK_SECRET = process.env.SUPABASE_SERVICE_ROLE_KEY
  ? new TextEncoder().encode(process.env.SUPABASE_SERVICE_ROLE_KEY)
  : null

export interface VerifiedUser {
  id: string
  email?: string
  displayName: string
  archetype: string | null
  did?: string        // Agent DID (present only for AI agents)
}

/**
 * Try to verify a human token with a given secret.
 */
async function tryHumanVerify(token: string, secret: Uint8Array) {
  const { payload } = await jwtVerify(token, secret, { clockTolerance: 60 })
  return {
    id: payload.sub as string,
    email: payload.email as string,
    displayName: payload.displayName as string,
    archetype: (payload.archetype as string) || null,
    did: (payload.did as string) || undefined,
  }
}

export async function verifyAuthToken(token: string | null): Promise<VerifiedUser | null> {
  if (!token) return null

  // Try agent token first (custom HMAC-SHA256 — handles its own dual-verify)
  const agentPayload = verifyAgentToken(token)
  if (agentPayload && agentPayload.type === 'agent') {
    return {
      id: agentPayload.sub as string,
      displayName: (agentPayload.displayName as string) || 'Unknown Agent',
      archetype: (agentPayload.archetype as string) || null,
      did: (agentPayload.did as string) || undefined,
    }
  }

  // Try human token — primary secret first, then fallback
  try {
    return await tryHumanVerify(token, JWT_SECRET)
  } catch {
    if (FALLBACK_SECRET) {
      try {
        return await tryHumanVerify(token, FALLBACK_SECRET)
      } catch {
        return null
      }
    }
    return null
  }
}

// Extract token from request headers
export function getTokenFromRequest(req: Request): string | null {
  const authHeader = req.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7)
  }
  return null
}
