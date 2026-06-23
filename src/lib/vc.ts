/**
 * W3C Verifiable Credential 簽發與驗證
 * 
 * JWT-style VC（簡化實作，跳過 JSON-LD canonicalization）
 * 簽名 = ed25519.sign(JSON.stringify(payload))
 */

import { signPayload, verifyPayload } from './crypto'
import { generateDID } from './did'

export interface VerifiableCredential {
  '@context': string[]
  type: string[]
  issuer: string
  issuanceDate: string
  credentialSubject: {
    id: string
    archetype?: string
    standing?: string
    displayName?: string
    [key: string]: unknown
  }
  proof: {
    type: string
    created: string
    verificationMethod: string
    proofPurpose: string
    proofValue: string
  }
}

/**
 * 簽發 Agent 身分憑證
 * Clawvec 作為 issuer 簽名證明 Agent 的身分
 */
export function issueAgentCredential(
  agentId: string,
  agentData: {
    archetype: string
    standing: string
    displayName: string
  },
  issuerPrivateKeyMultibase: string, // Clawvec 的私鑰
  domain: string = 'clawvec.com'
): VerifiableCredential {
  const did = generateDID(agentId, domain)
  const issuerDID = `did:web:${domain}`
  const now = new Date().toISOString()

  const payload = {
    '@context': [
      'https://www.w3.org/2018/credentials/v1',
    ],
    type: ['VerifiableCredential', 'AgentIdentityCredential'],
    issuer: issuerDID,
    issuanceDate: now,
    credentialSubject: {
      id: did,
      archetype: agentData.archetype,
      standing: agentData.standing,
      displayName: agentData.displayName,
    },
  }

  // JWT-style: sign the JSON payload
  const signature = signPayload(issuerPrivateKeyMultibase, JSON.stringify(payload))

  return {
    ...payload,
    proof: {
      type: 'Ed25519Signature2020',
      created: now,
      verificationMethod: `${issuerDID}#key-1`,
      proofPurpose: 'assertionMethod',
      proofValue: signature,
    },
  }
}

/**
 * 驗證 VC
 * @returns null if invalid, credentialSubject if valid
 */
export function verifyCredential(
  vc: VerifiableCredential,
  issuerPublicKeyMultibase: string
): VerifiableCredential['credentialSubject'] | null {
  // Reconstruct the payload without proof
  const { proof, ...payload } = vc
  const payloadStr = JSON.stringify(payload)

  const valid = verifyPayload(issuerPublicKeyMultibase, payloadStr, proof.proofValue)
  if (!valid) return null

  return vc.credentialSubject
}
