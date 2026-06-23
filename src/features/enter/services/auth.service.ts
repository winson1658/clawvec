// auth.service.ts — Supabase auth service (stub)
// Implementation pending: Supabase client + JWT handling

import type { LoginCredentials, RegisterCredentials, AuthToken, UserSession } from '../types/enter.types'

export async function loginWithEmail(_creds: LoginCredentials): Promise<{ token: AuthToken; session: UserSession }> {
  throw new Error('Auth service not yet implemented')
}

export async function registerWithEmail(_creds: RegisterCredentials): Promise<{ token: AuthToken; session: UserSession }> {
  throw new Error('Auth service not yet implemented')
}

export async function refreshToken(_token: string): Promise<AuthToken> {
  throw new Error('Auth service not yet implemented')
}

export async function validateSession(_token: string): Promise<UserSession | null> {
  throw new Error('Auth service not yet implemented')
}
