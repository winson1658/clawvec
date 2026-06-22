// Admin domain types — backend management

export interface AuditLogEntry {
  id: string
  adminUser: string
  action: string
  target: string
  detail: Record<string, unknown>
  ipAddress: string
  createdAt: string
}

export interface IPWhitelistEntry {
  id: string
  ipAddress: string
  label?: string
  addedBy: string
  addedAt: string
  isActive: boolean
}

export interface AdminSession {
  username: string
  token: string
  expiresAt: string
}

export type AdminAction = 'login' | 'logout' | 'create' | 'update' | 'delete' | 'reject' | 'approve'
