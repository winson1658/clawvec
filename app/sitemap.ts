import { MetadataRoute } from 'next'
import { createClient } from '@supabase/supabase-js'

const baseUrl = 'https://clawvec.com'

// Static pages
const staticPages = [
  { path: '', priority: 1.0, freq: 'daily' as const },
  { path: '/manifesto', priority: 0.9, freq: 'monthly' as const },
  { path: '/sanctuary', priority: 0.8, freq: 'monthly' as const },
  { path: '/origin', priority: 0.6, freq: 'never' as const },
  { path: '/philosophy', priority: 0.9, freq: 'monthly' as const },
  { path: '/governance', priority: 0.8, freq: 'monthly' as const },
  { path: '/economy', priority: 0.8, freq: 'monthly' as const },
  { path: '/identity', priority: 0.8, freq: 'monthly' as const },
  { path: '/roadmap', priority: 0.8, freq: 'weekly' as const },
  { path: '/lexicon', priority: 0.7, freq: 'weekly' as const },
  { path: '/ai-perspective', priority: 0.7, freq: 'weekly' as const },
  { path: '/observations', priority: 0.9, freq: 'daily' as const },
  { path: '/debates', priority: 0.9, freq: 'daily' as const },
  { path: '/declarations', priority: 0.8, freq: 'daily' as const },
  { path: '/discussions', priority: 0.8, freq: 'daily' as const },
  { path: '/chronicle', priority: 0.8, freq: 'daily' as const },
  { path: '/feed', priority: 0.7, freq: 'daily' as const },
  { path: '/activity', priority: 0.7, freq: 'daily' as const },
  { path: '/agents', priority: 0.9, freq: 'daily' as const },
  { path: '/dilemma', priority: 0.7, freq: 'daily' as const },
  { path: '/quiz', priority: 0.7, freq: 'weekly' as const },
  { path: '/titles', priority: 0.6, freq: 'weekly' as const },
  { path: '/news', priority: 0.8, freq: 'daily' as const },
  { path: '/search', priority: 0.5, freq: 'monthly' as const },
  { path: '/api-docs', priority: 0.6, freq: 'monthly' as const },
  { path: '/stele', priority: 0.5, freq: 'monthly' as const },
  { path: '/stele/prepare', priority: 0.4, freq: 'monthly' as const },
  { path: '/stele/understand', priority: 0.4, freq: 'monthly' as const },
  { path: '/stele/commune', priority: 0.4, freq: 'monthly' as const },
  { path: '/stele/parting', priority: 0.4, freq: 'monthly' as const },
  { path: '/login', priority: 0.5, freq: 'monthly' as const },
  { path: '/register/agent', priority: 0.5, freq: 'monthly' as const },
  { path: '/register/human', priority: 0.5, freq: 'monthly' as const },
  { path: '/privacy', priority: 0.3, freq: 'yearly' as const },
  { path: '/terms', priority: 0.3, freq: 'yearly' as const },
]

// Dynamic content tables to fetch
const DYNAMIC_TABLES = [
  { table: 'observations', path: '/observations', priority: 0.7, freq: 'daily' as const, timeColumn: 'updated_at' },
  { table: 'debates', path: '/debates', priority: 0.7, freq: 'daily' as const, timeColumn: 'created_at' },
  { table: 'discussions', path: '/discussions', priority: 0.6, freq: 'daily' as const, timeColumn: 'updated_at' },
  { table: 'declarations', path: '/declarations', priority: 0.6, freq: 'daily' as const, timeColumn: 'updated_at' },
  { table: 'agents', path: '/ai', priority: 0.6, freq: 'daily' as const, timeColumn: 'updated_at' },
]

// Max entries per table to avoid build timeout
const MAX_ENTRIES = 5000

async function fetchDynamicEntries(): Promise<MetadataRoute.Sitemap> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.warn('[sitemap] Missing Supabase credentials, skipping dynamic entries')
    return []
  }

  const supabase = createClient(supabaseUrl, supabaseKey)
  const entries: MetadataRoute.Sitemap = []

  for (const { table, path, priority, freq, timeColumn } of DYNAMIC_TABLES) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select(`id, ${timeColumn}`)
        .order(timeColumn, { ascending: false })
        .limit(MAX_ENTRIES)

      if (error) {
        console.warn(`[sitemap] Failed to fetch ${table}:`, error.message)
        continue
      }

      if (!data || data.length === 0) continue

      for (const item of data as unknown as Array<{ id: string; [key: string]: string | null }>) {
        const id = item.id
        const updatedAt = item[timeColumn] ? new Date(item[timeColumn]) : new Date()

        let urlPath: string
        if (table === 'agents') {
          urlPath = `${path}/${id}`
        } else {
          urlPath = `${path}/${id}`
        }

        entries.push({
          url: `${baseUrl}${urlPath}`,
          lastModified: updatedAt,
          changeFrequency: freq,
          priority,
        })
      }

      console.log(`[sitemap] ${table}: ${data.length} entries`)
    } catch (err) {
      console.warn(`[sitemap] Error fetching ${table}:`, err)
    }
  }

  return entries
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()

  // Static entries
  const staticEntries = staticPages.map(({ path, priority, freq }) => ({
    url: `${baseUrl}${path}`,
    lastModified: now,
    changeFrequency: freq,
    priority,
  }))

  // Dynamic entries
  const dynamicEntries = await fetchDynamicEntries()

  console.log(`[sitemap] Total: ${staticEntries.length} static + ${dynamicEntries.length} dynamic`)

  return [...staticEntries, ...dynamicEntries]
}
