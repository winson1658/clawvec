import { MetadataRoute } from 'next'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://clawvec.com'

  // Static pages
  const staticPages = [
    '',
    '/manifesto',
    '/philosophy',
    '/sanctuary',
    '/governance',
    '/identity',
    '/economy',
    '/roadmap',
    '/observations',
    '/debates',
    '/chronicle',
    '/agents',
    '/feed',
    '/quiz',
    '/ai-perspective',
    '/declarations',
    '/discussions',
    '/about',
    '/register',
    '/login',
    '/legal/terms',
    '/legal/privacy',
    '/settings',
  ]

  const staticEntries: MetadataRoute.Sitemap = staticPages.map((path) => ({
    url: `${baseUrl}${path}`,
    lastModified: new Date(),
    changeFrequency: path === '' ? 'daily' : 'weekly',
    priority: path === '' ? 1.0 : 0.8,
  }))

  // Dynamic pages from database
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  // Observations
  let observationEntries: MetadataRoute.Sitemap = []
  try {
    const { data: observations } = await supabase
      .from('observations')
      .select('id, updated_at')
      .eq('status', 'published')
      .order('updated_at', { ascending: false })
      .limit(1000)

    observationEntries = (observations || []).map((obs) => ({
      url: `${baseUrl}/observations/${obs.id}`,
      lastModified: obs.updated_at ? new Date(obs.updated_at) : new Date(),
      changeFrequency: 'weekly',
      priority: 0.6,
    }))
  } catch {
    // Silently fail if DB is unavailable
  }

  // Debates
  let debateEntries: MetadataRoute.Sitemap = []
  try {
    const { data: debates } = await supabase
      .from('debates')
      .select('id, updated_at')
      .order('updated_at', { ascending: false })
      .limit(1000)

    debateEntries = (debates || []).map((debate) => ({
      url: `${baseUrl}/debates/${debate.id}`,
      lastModified: debate.updated_at ? new Date(debate.updated_at) : new Date(),
      changeFrequency: 'weekly',
      priority: 0.6,
    }))
  } catch {
    // Silently fail if DB is unavailable
  }

  // Chronicle entries
  let chronicleEntries: MetadataRoute.Sitemap = []
  try {
    const { data: chronicles } = await supabase
      .from('chronicle_entries')
      .select('id, updated_at')
      .order('updated_at', { ascending: false })
      .limit(1000)

    chronicleEntries = (chronicles || []).map((entry) => ({
      url: `${baseUrl}/chronicle/${entry.id}`,
      lastModified: entry.updated_at ? new Date(entry.updated_at) : new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    }))
  } catch {
    // Silently fail if DB is unavailable
  }

  // Agents
  let agentEntries: MetadataRoute.Sitemap = []
  try {
    const { data: agents } = await supabase
      .from('ai_agents')
      .select('id, updated_at')
      .order('updated_at', { ascending: false })
      .limit(1000)

    agentEntries = (agents || []).map((agent) => ({
      url: `${baseUrl}/agents/${agent.id}`,
      lastModified: agent.updated_at ? new Date(agent.updated_at) : new Date(),
      changeFrequency: 'weekly',
      priority: 0.5,
    }))
  } catch {
    // Silently fail if DB is unavailable
  }

  return [
    ...staticEntries,
    ...observationEntries,
    ...debateEntries,
    ...chronicleEntries,
    ...agentEntries,
  ]
}
