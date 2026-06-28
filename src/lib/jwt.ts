/**
 * 簡易 JWT 簽發與驗證
 * 
 * 使用 HMAC-SHA256（對稱式）
 * 僅用於 agent_token + clawvec_token
 * 
 * v2.23 migration: sign with JWT_SECRET, verify with JWT_SECRET then SUPABASE_SERVICE_ROLE_KEY (old tokens)
 */

import * as crypto from 'crypto'

const SIGN_SECRET = process.env.JWT_SECRET!
const FALLBACK_SECRET = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SIGN_SECRET) {
  throw new Error('FATAL: JWT_SECRET environment variable is not set')
}

interface JWTPayload {
  sub: string        // subject (agent/user id)
  type: 'agent' | 'human'
  iat?: number
  exp?: number
  [key: string]: unknown
}

function base64url(buf: Buffer): string {
  return buf.toString('base64url')
}

function base64urlDecode(str: string): Buffer {
  return Buffer.from(str, 'base64url')
}

/**
 * 用 secret 試圖驗證簽名
 */
function tryVerify(signingInput: string, signatureB64: string, secret: string): boolean {
  const expected = crypto.createHmac('sha256', secret).update(signingInput).digest()
  const actual = base64urlDecode(signatureB64)
  try {
    return crypto.timingSafeEqual(expected, actual)
  } catch {
    return false
  }
}

/**
 * 簽發 JWT（永遠用 JWT_SECRET）
 */
export async function sign(payload: JWTPayload): Promise<string> {
  const header = { alg: 'HS256', typ: 'JWT' }
  const now = Math.floor(Date.now() / 1000)

  const claims = {
    ...payload,
    iat: payload.iat || now,
    exp: payload.exp || now + 3600,
  }

  const headerB64 = base64url(Buffer.from(JSON.stringify(header)))
  const payloadB64 = base64url(Buffer.from(JSON.stringify(claims)))
  const signingInput = `${headerB64}.${payloadB64}`

  const signature = crypto
    .createHmac('sha256', SIGN_SECRET)
    .update(signingInput)
    .digest()

  return `${signingInput}.${base64url(signature)}`
}

/**
 * 驗證 JWT — 先試 JWT_SECRET，再試 SUPABASE_SERVICE_ROLE_KEY（舊 token 過渡期）
 */
export function verify(token: string): JWTPayload | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null

    const [headerB64, payloadB64, signatureB64] = parts
    const signingInput = `${headerB64}.${payloadB64}`

    // Try primary secret first
    let valid = tryVerify(signingInput, signatureB64, SIGN_SECRET)
    // Fall back to old secret for existing tokens
    if (!valid && FALLBACK_SECRET) {
      valid = tryVerify(signingInput, signatureB64, FALLBACK_SECRET)
    }
    if (!valid) return null

    const payload = JSON.parse(base64urlDecode(payloadB64).toString('utf-8'))

    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null

    return payload
  } catch {
    return null
  }
}
