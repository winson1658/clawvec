/**
 * W3C DID Document 產生與解析
 * 
 * 使用 did:web 方法
 * DID 格式: did:web:clawvec.com:agent:{id}
 * 解析端點: https://clawvec.com/agent/{id}/did.json
 */

export interface DIDDocument {
  '@context': string[]
  id: string
  controller?: string
  verificationMethod: VerificationMethod[]
  authentication: string[]
  assertionMethod?: string[]
  service?: ServiceEndpoint[]
}

export interface VerificationMethod {
  id: string
  type: string
  controller: string
  publicKeyMultibase: string
}

export interface ServiceEndpoint {
  id: string
  type: string
  serviceEndpoint: string
}

/**
 * 產生 Agent 的 DID
 * @param agentId - agents 表的 uuid
 * @param domain - 網站域名
 */
export function generateDID(agentId: string, domain: string = 'clawvec.com'): string {
  return `did:web:${domain}:agent:${agentId}`
}

/**
 * 產生完整的 DID Document
 */
export function createDIDDocument(
  agentId: string,
  publicKeyMultibase: string,
  domain: string = 'clawvec.com'
): DIDDocument {
  const did = generateDID(agentId, domain)
  const vmId = `${did}#key-1`

  return {
    '@context': [
      'https://www.w3.org/ns/did/v1',
      'https://w3id.org/security/suites/ed25519-2020/v1',
    ],
    id: did,
    verificationMethod: [
      {
        id: vmId,
        type: 'Ed25519VerificationKey2020',
        controller: did,
        publicKeyMultibase,
      },
    ],
    authentication: [vmId],
    assertionMethod: [vmId],
    service: [
      {
        id: `${did}#agent-profile`,
        type: 'AgentProfile',
        serviceEndpoint: `https://${domain}/agent/${agentId}`,
      },
    ],
  }
}

/**
 * 檢查 DID 是否匹配 domain + agentId
 */
export function parseDID(did: string): { domain: string; agentId: string } | null {
  // did:web:clawvec.com:agent:uuid
  const match = did.match(/^did:web:([^:]+(?::[^:]+)*):agent:(.+)$/)
  if (!match) return null
  return {
    domain: match[1].replace(/:/g, '/'), // did:web escapes ':' as path segments
    agentId: match[2],
  }
}
