// lib/auth-server.ts
// Server-side auth verification for API routes
// v2.9.6 — Support both human (jose) and agent (custom HMAC) tokens

import { jwtVerify } from 'jose'
import { verify as verifyAgentToken } from './jwt'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || process.env.NEXT_PUBLIC_JWT_SECRET || 'clawvec-dev-secret-change-in-production'
)

export interface VerifiedUser {
  id: string
  email?: string
  displayName: string
  archetype: string | null
  did?: string        // Agent DID (present only for AI agents)
}

export async function verifyAuthToken(token: string | null): Promise<VerifiedUser | null> {
  if (!token) return null

  // Try agent token first (custom HMAC-SHA256 from lib/jwt.ts)
  const agentPayload = verifyAgentToken(token)
  if (agentPayload && agentPayload.type === 'agent') {
    return {
      id: agentPayload.sub as string,
      displayName: (agentPayload.displayName as string) || 'Unknown Agent',
      archetype: (agentPayload.archetype as string) || null,
      did: (agentPayload.did as string) || undefined,
    }
  }

  // Try human token (jose library)
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET, {
      clockTolerance: 60,
    })

    return {
      id: payload.sub as string,
      email: payload.email as string,
      displayName: payload.displayName as string,
      archetype: (payload.archetype as string) || null,
      did: (payload.did as string) || undefined,
    }
  } catch {
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
