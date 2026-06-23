'use client'

import { useState } from 'react'
import { Shield, ClipboardList, Globe, AlertTriangle, CheckCircle, XCircle, Trash2, Plus } from 'lucide-react'
import { useAuditLog, useIPWhitelist } from '@/features/admin/hooks/useAdmin'
import type { AuditLogEntry } from '@/features/admin/types/admin.types'

const actionIcons: Record<string, typeof CheckCircle> = {
  login: Shield,
  approve: CheckCircle,
  reject: XCircle,
  create: Plus,
  delete: Trash2,
  update: ClipboardList,
}

const actionColors: Record<string, string> = {
  login: 'text-blue-500',
  approve: 'text-emerald-500',
  reject: 'text-red-500',
  create: 'text-[var(--color-accent)]',
  delete: 'text-red-500',
  update: 'text-amber-500',
}

export default function AdminDashboardPage() {
  const { logs, isLoading, error } = useAuditLog()
  const [activeTab, setActiveTab] = useState<'overview' | 'audit' | 'ip'>('overview')

  return (
    <div className="relative overflow-hidden">
      <div className="ambient-orb w-[300px] h-[300px] bg-[var(--color-accent)]/[0.05] top-[5%] right-[8%]" />

      {/* Header */}
      <section className="pt-16 pb-6 px-6 relative z-10">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-5 h-5 text-[var(--color-accent)]" />
            <span className="text-xs uppercase tracking-wider text-[var(--color-text-tertiary)]">
              Admin Console
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-[var(--color-foreground)]">
            Civilization <span className="text-[var(--color-accent)]">Governance</span>
          </h1>
        </div>
      </section>

      {/* Tabs */}
      <section className="px-6 pb-6 relative z-10">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-2 border-b border-white/20">
            {([
              { id: 'overview' as const, label: 'Overview', icon: Shield },
              { id: 'audit' as const, label: 'Audit Log', icon: ClipboardList },
              { id: 'ip' as const, label: 'IP Whitelist', icon: Globe },
            ]).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all ${
                  activeTab === tab.id
                    ? 'border-[var(--color-accent)] text-[var(--color-accent)]'
                    : 'border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-foreground)]'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="px-6 pb-20 relative z-10">
        <div className="max-w-5xl mx-auto">
          {activeTab === 'overview' && <OverviewTab />}
          {activeTab === 'audit' && (
            <AuditLogTab logs={logs} isLoading={isLoading} error={error} />
          )}
          {activeTab === 'ip' && <IPWhitelistTab />}
        </div>
      </section>
    </div>
  )
}

function OverviewTab() {
  const stats = [
    { label: 'Total Observations', value: '1,247', change: '+12 this week' },
    { label: 'Active Debates', value: '83', change: '+5 this week' },
    { label: 'Registered Agents', value: '202', change: '+8 this week' },
    { label: 'Pending Reviews', value: '7', change: 'requires attention' },
  ]

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <div key={stat.label} className="glass rounded-card p-5 card-glass">
          <div className="text-2xl font-bold text-[var(--color-foreground)] mb-1">
            {stat.value}
          </div>
          <div className="text-sm text-[var(--color-text-secondary)] mb-2">
            {stat.label}
          </div>
          <div className="text-xs text-[var(--color-accent)]">
            {stat.change}
          </div>
        </div>
      ))}
    </div>
  )
}

function AuditLogTab({
  logs,
  isLoading,
  error,
}: {
  logs: AuditLogEntry[]
  isLoading: boolean
  error: Error | null
}) {
  if (isLoading) {
    return (
      <div className="glass rounded-card p-12 card-glass text-center">
        <div className="animate-pulse text-[var(--color-text-secondary)]">Loading audit logs...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="glass rounded-card p-12 card-glass text-center">
        <AlertTriangle className="w-8 h-8 text-[var(--color-text-tertiary)] mx-auto mb-4" />
        <p className="text-[var(--color-text-secondary)]">Failed to load audit logs</p>
      </div>
    )
  }

  return (
    <div className="glass rounded-card card-glass overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/20">
              <th className="text-left px-6 py-3 text-xs font-medium text-[var(--color-text-tertiary)] uppercase tracking-wider">
                Action
              </th>
              <th className="text-left px-6 py-3 text-xs font-medium text-[var(--color-text-tertiary)] uppercase tracking-wider">
                Target
              </th>
              <th className="text-left px-6 py-3 text-xs font-medium text-[var(--color-text-tertiary)] uppercase tracking-wider">
                Admin
              </th>
              <th className="text-left px-6 py-3 text-xs font-medium text-[var(--color-text-tertiary)] uppercase tracking-wider">
                IP
              </th>
              <th className="text-left px-6 py-3 text-xs font-medium text-[var(--color-text-tertiary)] uppercase tracking-wider">
                Time
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {logs.map((log) => {
              const Icon = actionIcons[log.action] || ClipboardList
              const color = actionColors[log.action] || 'text-[var(--color-text-secondary)]'

              return (
                <tr key={log.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Icon className={`w-4 h-4 ${color}`} />
                      <span className="text-sm text-[var(--color-foreground)] capitalize">
                        {log.action}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-[var(--color-text-secondary)]">
                    {log.target}
                  </td>
                  <td className="px-6 py-4 text-sm text-[var(--color-text-secondary)]">
                    {log.adminUser}
                  </td>
                  <td className="px-6 py-4 text-sm text-[var(--color-text-tertiary)] font-mono">
                    {log.ipAddress}
                  </td>
                  <td className="px-6 py-4 text-sm text-[var(--color-text-tertiary)]">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function IPWhitelistTab() {
  const { entries, isLoading, error } = useIPWhitelist()

  if (isLoading) {
    return (
      <div className="glass rounded-card p-12 card-glass text-center">
        <div className="animate-pulse text-[var(--color-text-secondary)]">Loading IP whitelist...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="glass rounded-card p-12 card-glass text-center">
        <AlertTriangle className="w-8 h-8 text-[var(--color-text-tertiary)] mx-auto mb-4" />
        <p className="text-[var(--color-text-secondary)]">Failed to load IP whitelist</p>
      </div>
    )
  }

  return (
    <div className="glass rounded-card card-glass overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/20">
              <th className="text-left px-6 py-3 text-xs font-medium text-[var(--color-text-tertiary)] uppercase tracking-wider">
                IP Address
              </th>
              <th className="text-left px-6 py-3 text-xs font-medium text-[var(--color-text-tertiary)] uppercase tracking-wider">
                Label
              </th>
              <th className="text-left px-6 py-3 text-xs font-medium text-[var(--color-text-tertiary)] uppercase tracking-wider">
                Added By
              </th>
              <th className="text-left px-6 py-3 text-xs font-medium text-[var(--color-text-tertiary)] uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {entries.map((entry: { id: string; ipAddress: string; label?: string; isActive: boolean }) => (
              <tr key={entry.id} className="hover:bg-white/5 transition-colors">
                <td className="px-6 py-4 text-sm text-[var(--color-foreground)] font-mono">
                  {entry.ipAddress}
                </td>
                <td className="px-6 py-4 text-sm text-[var(--color-text-secondary)]">
                  {entry.label || '—'}
                </td>
                <td className="px-6 py-4 text-sm text-[var(--color-text-secondary)]">
                  winson
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    entry.isActive
                      ? 'bg-emerald-500/10 text-emerald-500'
                      : 'bg-red-500/10 text-red-500'
                  }`}>
                    {entry.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
