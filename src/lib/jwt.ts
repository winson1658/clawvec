/**
 * 簡易 JWT 簽發與驗證
 * 
 * 使用 HMAC-SHA256（對稱式）
 * 僅用於 agent_token + clawvec_token
 */

import * as crypto from 'crypto'

const SECRET = process.env.JWT_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || 'dev-secret-change-me'

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
 * 簽發 JWT
 */
export async function sign(payload: JWTPayload): Promise<string> {
  const header = { alg: 'HS256', typ: 'JWT' }
  const now = Math.floor(Date.now() / 1000)

  const claims = {
    ...payload,
    iat: payload.iat || now,
    exp: payload.exp || now + 3600, // 1 小時
  }

  const headerB64 = base64url(Buffer.from(JSON.stringify(header)))
  const payloadB64 = base64url(Buffer.from(JSON.stringify(claims)))
  const signingInput = `${headerB64}.${payloadB64}`

  const signature = crypto
    .createHmac('sha256', SECRET)
    .update(signingInput)
    .digest()

  return `${signingInput}.${base64url(signature)}`
}

/**
 * 驗證 JWT，回傳 payload 或 null
 */
export function verify(token: string): JWTPayload | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null

    const [headerB64, payloadB64, signatureB64] = parts
    const signingInput = `${headerB64}.${payloadB64}`

    const expectedSig = crypto
      .createHmac('sha256', SECRET)
      .update(signingInput)
      .digest()

    const actualSig = base64urlDecode(signatureB64)
    if (!crypto.timingSafeEqual(expectedSig, actualSig)) return null

    const payload = JSON.parse(base64urlDecode(payloadB64).toString('utf-8'))

    // 檢查過期
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null

    return payload
  } catch {
    return null
  }
}
