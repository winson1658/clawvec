/**
 * W3C DID + VC 加密核心
 * 
 * 使用 Node.js 原生 crypto（Ed25519）
 * 零外部依賴，符合 W3C 規範
 */

import * as crypto from 'crypto'

export interface KeyPair {
  publicKey: string   // multibase base58btc (z-prefix)
  privateKey: string  // multibase base58btc (z-prefix)
  publicKeyRaw: Buffer
  privateKeyRaw: Buffer
}

/**
 * 生成 Ed25519 密鑰對（Node.js 原生 crypto）
 */
export function generateKeyPair(): KeyPair {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519', {
    publicKeyEncoding: { type: 'spki', format: 'der' },
    privateKeyEncoding: { type: 'pkcs8', format: 'der' },
  })

  const publicKeyRaw = publicKey.subarray(-32)
  const privateKeyRaw = privateKey.subarray(-32)

  return {
    publicKey: 'z' + toBase58(publicKeyRaw),
    privateKey: 'z' + toBase58(privateKeyRaw),
    publicKeyRaw,
    privateKeyRaw,
  }
}

/**
 * 簽名 payload 字串（便利函數）
 */
export function signPayload(privateKeyMultibase: string, payload: string): string {
  const rawKey = fromBase58(privateKeyMultibase.slice(1))
  const message = Buffer.from(payload, 'utf-8')
  const pkcs8 = wrapPKCS8(rawKey)
  
  const sigDer = crypto.sign(null, message, {
    key: pkcs8, format: 'der', type: 'pkcs8',
  })
  
  // Extract raw 64-byte signature from DER
  const sigRaw = Buffer.concat([sigDer.subarray(4, 36), sigDer.subarray(38)])
  return 'z' + toBase58(sigRaw)
}

/**
 * 驗證 payload 簽名（便利函數）
 */
export function verifyPayload(publicKeyMultibase: string, payload: string, signatureMultibase: string): boolean {
  const rawKey = fromBase58(publicKeyMultibase.slice(1))
  const rawSig = fromBase58(signatureMultibase.slice(1))
  const message = Buffer.from(payload, 'utf-8')
  
  // Wrap signature in DER
  const sigDer = Buffer.concat([
    Buffer.from([0x30, rawSig.length + 2, 0x02, rawSig.length / 2]),
    rawSig.subarray(0, rawSig.length / 2),
    Buffer.from([0x02, rawSig.length / 2]),
    rawSig.subarray(rawSig.length / 2),
  ])
  
  // Wrap public key in SPKI DER
  const spki = Buffer.concat([
    Buffer.from('302a300506032b6570032100', 'hex'),
    rawKey,
  ])
  
  return crypto.verify(null, message, { key: spki, format: 'der', type: 'spki' }, sigDer)
}

/**
 * 產生隨機 challenge nonce
 */
export function generateChallenge(): string {
  return crypto.randomBytes(32).toString('hex')
}

// --- DER helpers ---

function wrapPKCS8(rawKey: Buffer): Buffer {
  const prefix = Buffer.from('302e020100300506032b657004220420', 'hex')
  return Buffer.concat([prefix, rawKey])
}

// --- Base58 (不含外部依賴，純 JS) ---

const B58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'
const B58_MAP = new Map<string, number>()
for (let i = 0; i < B58_ALPHABET.length; i++) {
  B58_MAP.set(B58_ALPHABET[i], i)
}

function toBase58(buf: Buffer): string {
  if (buf.length === 0) return ''
  
  // Count leading zeros
  let zeros = 0
  while (zeros < buf.length && buf[zeros] === 0) zeros++
  
  // Convert to base58
  const digits: number[] = []
  for (let i = zeros; i < buf.length; i++) {
    let carry = buf[i]
    for (let j = 0; j < digits.length; j++) {
      carry += digits[j] * 256
      digits[j] = carry % 58
      carry = Math.floor(carry / 58)
    }
    while (carry > 0) {
      digits.push(carry % 58)
      carry = Math.floor(carry / 58)
    }
  }
  
  return '1'.repeat(zeros) + digits.reverse().map(d => B58_ALPHABET[d]).join('')
}

function fromBase58(str: string): Buffer {
  if (str.length === 0) return Buffer.alloc(0)
  
  // Count leading ones
  let zeros = 0
  while (zeros < str.length && str[zeros] === '1') zeros++
  
  // Convert from base58
  const bytes: number[] = []
  for (let i = zeros; i < str.length; i++) {
    const digit = B58_MAP.get(str[i])
    if (digit === undefined) throw new Error(`Invalid base58 character: ${str[i]}`)
    let carry = digit
    for (let j = 0; j < bytes.length; j++) {
      carry += bytes[j] * 58
      bytes[j] = carry & 0xff
      carry >>= 8
    }
    while (carry > 0) {
      bytes.push(carry & 0xff)
      carry >>= 8
    }
  }
  
  const result = Buffer.alloc(zeros + bytes.length)
  result.fill(0, 0, zeros)
  for (let i = 0; i < bytes.length; i++) {
    result[zeros + i] = bytes[bytes.length - 1 - i]
  }
  return result
}
