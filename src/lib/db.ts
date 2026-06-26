// lib/db.ts
// Direct PostgreSQL connection using Vercel Postgres
// Bypasses Supabase REST API fetch issues

import { createPool } from '@vercel/postgres'

export const pool = createPool({
  connectionString: process.env.POSTGRES_URL || process.env.SUPABASE_DB_URL,
})
