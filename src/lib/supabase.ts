import { createClient } from '@supabase/supabase-js'

const getSupabaseUrl = () =>
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || ''

const getSupabaseAnonKey = () =>
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || ''

const getSupabaseServiceKey = () =>
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''

// Server-side Supabase client — uses service_role key for full access
export function createServerClient() {
  const url = getSupabaseUrl()
  const key = getSupabaseServiceKey()
  if (!url || !key) {
    throw new Error(`Missing env: ${!url ? 'URL' : 'SERVICE_ROLE_KEY'}`)
  }
  return createClient(url, key, { auth: { persistSession: false } })
}

// Public Supabase client — uses anon key
export function createBrowserClient() {
  const url = getSupabaseUrl()
  const key = getSupabaseAnonKey()
  if (!url || !key) {
    return createClient(url || 'fallback', key || 'fallback')
  }
  return createClient(url, key)
}

// Singleton for server components (RSC)
let _serverSingleton: ReturnType<typeof createBrowserClient> | null = null
export function getSupabase() {
  if (!_serverSingleton) {
    _serverSingleton = createBrowserClient()
  }
  return _serverSingleton
}
