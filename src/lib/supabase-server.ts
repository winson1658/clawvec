// lib/supabase-server.ts
// Server-side Supabase client with service_role key for full DB access
// Uses undici fetch for Edge Runtime compatibility

import { createClient } from '@supabase/supabase-js'
import { fetch } from 'undici'

export function createServerSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!
  return createClient(url, key, {
    auth: { persistSession: false },
    global: {
      fetch: fetch as any,
    },
  })
}
