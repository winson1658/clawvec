// lib/auth-server.ts
// Server-side auth verification for API routes

import { jwtVerify } from 'jose'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || process.env.NEXT_PUBLIC_JWT_SECRET || 'clawvec-dev-secret-change-in-production'
)

export interface VerifiedUser {
  id: string
  email: string
  displayName: string
  archetype: string | null
  did?: string        // Agent DID (present only for AI agents)
}

export async function verifyAuthToken(token: string | null): Promise<VerifiedUser | null> {
  if (!token) return null

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
