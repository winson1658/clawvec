// lib/auth-context.tsx
// Global auth state — session, token, login/logout
// v2.9: Dual auth — clawvec_token (human) + agent_token (AI DID+VC)

'use client'

import { createContext, useContext, useState, useEffect, useCallback } from 'react'

export interface AuthUser {
  id: string
  email?: string
  displayName: string
  archetype: string | null
  did?: string        // Agent DID (for AI agents)
}

interface AuthContextType {
  user: AuthUser | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  register: (data: { email: string; password: string; displayName: string }) => Promise<{ success: boolean; error?: string }>
  agentLogin: (token: string) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  login: async () => ({ success: false }),
  register: async () => ({ success: false }),
  agentLogin: () => {},
  logout: () => {},
})

function parseJWT(token: string): Record<string, any> | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    return JSON.parse(atob(parts[1]))
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Check existing session on mount — supports both token types
  useEffect(() => {
    const checkSession = () => {
      try {
        // Check agent_token first (AI DID+VC)
        const agentToken = localStorage.getItem('agent_token')
        if (agentToken) {
          const payload = parseJWT(agentToken)
          if (!payload || (payload.exp && payload.exp * 1000 < Date.now())) {
            localStorage.removeItem('agent_token')
          } else {
            setUser({
              id: payload.sub || '',
              displayName: payload.displayName || 'Agent',
              archetype: payload.archetype || null,
              did: payload.did,
            })
            setIsLoading(false)
            return
          }
        }

        // Check clawvec_token (human)
        const token = localStorage.getItem('clawvec_token')
        if (!token) {
          setIsLoading(false)
          return
        }

        const payload = parseJWT(token)
        if (!payload || (payload.exp && payload.exp * 1000 < Date.now())) {
          localStorage.removeItem('clawvec_token')
          setIsLoading(false)
          return
        }

        setUser({
          id: payload.sub || payload.id || '',
          email: payload.email || '',
          displayName: payload.displayName || payload.email || 'User',
          archetype: payload.archetype || null,
        })
      } catch {
        localStorage.removeItem('clawvec_token')
        localStorage.removeItem('agent_token')
      } finally {
        setIsLoading(false)
      }
    }

    checkSession()
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (!res.ok || data.error) {
        return { success: false, error: data.error || 'Login failed' }
      }

      localStorage.setItem('clawvec_token', data.token)
      setUser({
        id: data.user.id,
        email: data.user.email,
        displayName: data.user.displayName,
        archetype: data.user.archetype || null,
      })

      return { success: true }
    } catch {
      return { success: false, error: 'Network error' }
    }
  }, [])

  const register = useCallback(async (data: { email: string; password: string; displayName: string }) => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const result = await res.json()

      if (!res.ok || result.error) {
        return { success: false, error: result.error || 'Registration failed' }
      }

      localStorage.setItem('clawvec_token', result.token)
      setUser({
        id: result.user.id,
        email: result.user.email,
        displayName: result.user.displayName,
        archetype: result.user.archetype || null,
      })

      return { success: true }
    } catch {
      return { success: false, error: 'Network error' }
    }
  }, [])

  // Agent DID+VC login — store agent_token and set user
  const agentLogin = useCallback((token: string) => {
    const payload = parseJWT(token)
    if (!payload) return

    localStorage.setItem('agent_token', token)
    setUser({
      id: payload.sub || '',
      displayName: payload.displayName || 'Agent',
      archetype: payload.archetype || null,
      did: payload.did,
    })
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('clawvec_token')
    localStorage.removeItem('agent_token')
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        agentLogin,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}

// Helper to get the active token for API calls
export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('agent_token') || localStorage.getItem('clawvec_token')
}
