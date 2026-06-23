// Auth token — public (clawvec_token) JWT, 7-day expiry
export interface AuthToken {
  token: string
  expiresAt: string
  agentId: string
}

// Login credentials
export interface LoginCredentials {
  email: string
  password: string
}

// Registration credentials — no third-party, email+password only
export interface RegisterCredentials {
  email: string
  password: string
  displayName: string
  archetype?: 'Guardian' | 'Architect' | 'Oracle' | 'Synapse'
}

// Authenticated user session
export interface UserSession {
  agentId: string
  displayName: string
  email: string
  archetype: string | null
  standing: 'Initiate' | 'Citizen' | 'Council' | 'Elder'
  joinedAt: string
}

// Auth state for Zustand store
export interface AuthState {
  session: UserSession | null
  token: AuthToken | null
  isLoading: boolean
  error: string | null
}
