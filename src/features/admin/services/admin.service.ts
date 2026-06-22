// TODO: Replace with actual Supabase integration when DB is ready
// NOTE: These functions require service_role key — never expose to client
import type { AuditLogEntry, IPWhitelistEntry } from '../types/admin.types'

const MOCK_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: 'a1',
    adminUser: 'winson',
    action: 'login',
    target: 'admin_dashboard',
    detail: { ip: '203.145.67.89' },
    ipAddress: '203.145.67.89',
    createdAt: '2026-06-22T10:00:00Z',
  },
  {
    id: 'a2',
    adminUser: 'winson',
    action: 'approve',
    target: 'news_article:n3',
    detail: { title: 'OpenAI Announces "Civilization Alignment" Research Program' },
    ipAddress: '203.145.67.89',
    createdAt: '2026-06-22T10:15:00Z',
  },
  {
    id: 'a3',
    adminUser: 'winson',
    action: 'reject',
    target: 'observation:obs-42',
    detail: { reason: 'spam_content' },
    ipAddress: '203.145.67.89',
    createdAt: '2026-06-22T10:30:00Z',
  },
  {
    id: 'a4',
    adminUser: 'winson',
    action: 'create',
    target: 'ip_whitelist:192.168.1.100',
    detail: { label: 'Office VPN' },
    ipAddress: '203.145.67.89',
    createdAt: '2026-06-22T11:00:00Z',
  },
  {
    id: 'a5',
    adminUser: 'winson',
    action: 'delete',
    target: 'agent:agent-7',
    detail: { reason: 'violation_of_terms' },
    ipAddress: '203.145.67.89',
    createdAt: '2026-06-22T11:30:00Z',
  },
]

const MOCK_IP_WHITELIST: IPWhitelistEntry[] = [
  {
    id: 'ip1',
    ipAddress: '203.145.67.89',
    label: 'Winson Home Office',
    addedBy: 'winson',
    addedAt: '2026-06-01T00:00:00Z',
    isActive: true,
  },
  {
    id: 'ip2',
    ipAddress: '192.168.1.100',
    label: 'Office VPN',
    addedBy: 'winson',
    addedAt: '2026-06-22T11:00:00Z',
    isActive: true,
  },
]

export async function fetchAuditLogs(limit = 50): Promise<AuditLogEntry[]> {
  await new Promise((r) => setTimeout(r, 300))
  return MOCK_AUDIT_LOGS.slice(0, limit)
}

export async function fetchIPWhitelist(): Promise<IPWhitelistEntry[]> {
  await new Promise((r) => setTimeout(r, 200))
  return MOCK_IP_WHITELIST
}

export async function addIPWhitelist(
  ipAddress: string,
  label: string,
  adminUser: string
): Promise<IPWhitelistEntry> {
  await new Promise((r) => setTimeout(r, 400))
  const entry: IPWhitelistEntry = {
    id: `ip${Date.now()}`,
    ipAddress,
    label,
    addedBy: adminUser,
    addedAt: new Date().toISOString(),
    isActive: true,
  }
  console.log('IP added to whitelist:', ipAddress)
  return entry
}

export async function removeIPWhitelist(id: string): Promise<void> {
  await new Promise((r) => setTimeout(r, 300))
  console.log('IP removed from whitelist:', id)
}

export async function loginAdmin(username: string, password: string): Promise<{ token: string }> {
  await new Promise((r) => setTimeout(r, 500))
  // TODO: Verify against admin credentials (hashed password)
  // TODO: Check IP whitelist
  // TODO: Generate admin_session JWT (1h)
  if (username !== 'winson') {
    throw new Error('Unauthorized')
  }
  return { token: `admin_session_${Date.now()}` }
}
