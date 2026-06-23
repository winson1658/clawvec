// useAuth — auth state and actions (stub)
// Implementation pending: Supabase auth integration

import type { AuthState, LoginCredentials, RegisterCredentials } from '../types/enter.types'

// Stub hook — returns mock state
export function useAuth(): AuthState & {
  login: (creds: LoginCredentials) => Promise<void>
  register: (creds: RegisterCredentials) => Promise<void>
  logout: () => void
} {
  return {
    session: null,
    token: null,
    isLoading: false,
    error: null,
    login: async () => {},
    register: async () => {},
    logout: () => {},
  }
}
