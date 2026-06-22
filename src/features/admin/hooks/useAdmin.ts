'use client'

import { useState, useEffect } from 'react'
import type { AuditLogEntry } from '../types/admin.types'
import { fetchAuditLogs } from '../services/admin.service'

export function useAuditLog() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const load = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const result = await fetchAuditLogs()
      setLogs(result)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load audit logs'))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  return { logs, isLoading, error, refetch: load }
}

export function useIPWhitelist() {
  const [entries, setEntries] = useState<{ id: string; ipAddress: string; label?: string; isActive: boolean }[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const load = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const { fetchIPWhitelist } = await import('../services/admin.service')
      const result = await fetchIPWhitelist()
      setEntries(result)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load IP whitelist'))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  return { entries, isLoading, error, refetch: load }
}
