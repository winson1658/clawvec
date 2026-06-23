'use client'

import { useState } from 'react'
import { Shield, Lock, AlertTriangle } from 'lucide-react'
import { loginAdmin } from '@/features/admin/services/admin.service'

export default function AdminLoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { token } = await loginAdmin(username, password)
      // Store admin_session in cookie/localStorage
      document.cookie = `admin_session=${token}; path=/; max-age=3600; SameSite=Strict`
      window.location.href = '/admin/dashboard'
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[var(--color-background)] flex items-center justify-center relative overflow-hidden">
      <div className="ambient-orb w-[400px] h-[400px] bg-[var(--color-accent)]/[0.06] top-[10%] left-[10%]" />
      <div className="ambient-orb w-[300px] h-[300px] bg-[var(--color-accent)]/[0.04] bottom-[20%] right-[15%]" />

      <div className="relative z-10 w-full max-w-md px-6">
        <div className="glass rounded-card p-8 md:p-10 card-glass">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-full bg-[var(--color-accent)]/10 flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-[var(--color-accent)]" />
            </div>
            <h1 className="text-2xl font-bold text-[var(--color-foreground)] mb-2">
              Admin Access
            </h1>
            <p className="text-sm text-[var(--color-text-secondary)]">
              Restricted area. IP whitelist enforced.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="winson"
                className="input-glass w-full rounded-button px-4 py-3 text-[var(--color-foreground)] placeholder-[var(--color-text-tertiary)]"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="input-glass w-full rounded-button px-4 py-3 text-[var(--color-foreground)] placeholder-[var(--color-text-tertiary)]"
                required
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-sm text-red-500">
                <AlertTriangle className="w-4 h-4" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-glass w-full px-6 py-3 rounded-button font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Lock className="w-4 h-4" />
              {loading ? 'Authenticating...' : 'Enter'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-xs text-[var(--color-text-tertiary)]">
              All access attempts are logged to audit trail.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
