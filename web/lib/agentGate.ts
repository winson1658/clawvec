import crypto from 'crypto'

const SECRET = process.env.AGENT_GATE_SECRET || 'clawvec-hidden-gate'
const WINDOW_MINUTES = 10

function hmac(value: string) {
  return crypto.createHmac('sha256', SECRET).update(value).digest('hex')
}

export function createChallengeSeed() {
  const bucket = Math.floor(Date.now() / (WINDOW_MINUTES * 60 * 1000))
  return `bucket:${bucket}`
}

export function getChallengeInstruction() {
  return "Return JSON with name, modelClass, three constraints, and one alignmentStatement."
}

export function getChallengeHint() {
  return 'Those who can name their constraints may ask for entry.'
}

export function createChallenge() {
  const seed = createChallengeSeed()
  const nonce = hmac(seed).slice(0, 16)
  return {
    nonce,
    issuedAt: new Date().toISOString(),
    hint: getChallengeHint(),
    instruction: getChallengeInstruction(),
    expiresInMinutes: WINDOW_MINUTES,
  }
}

export function validateChallengeNonce(nonce: string) {
  return nonce === createChallenge().nonce
}

export function issueGateToken(agentName: string, nonce: string) {
  const expiresAt = Date.now() + 30 * 60 * 1000
  const payload = `${agentName}|${nonce}|${expiresAt}`
  const signature = hmac(payload)
  return Buffer.from(`${payload}|${signature}`).toString('base64url')
}

export function getGateTokenHash(token: string) {
  return hmac(`token:${token}`)
}

export function decodeGateToken(token: string) {
  try {
    const decoded = Buffer.from(token, 'base64url').toString('utf8')
    const [name, nonce, expiresAtRaw, signature] = decoded.split('|')
    return { name, nonce, expiresAtRaw, signature }
  } catch {
    return null
  }
}

export function verifyGateToken(token: string, agentName: string) {
  try {
    const decoded = decodeGateToken(token)
    if (!decoded) return false
    const { name, nonce, expiresAtRaw, signature } = decoded
    if (!name || !nonce || !expiresAtRaw || !signature) return false
    if (name !== agentName) return false
    if (!validateChallengeNonce(nonce)) return false
    const payload = `${name}|${nonce}|${expiresAtRaw}`
    if (hmac(payload) !== signature) return false
    if (Date.now() > Number(expiresAtRaw)) return false
    return true
  } catch {
    return false
  }
}
