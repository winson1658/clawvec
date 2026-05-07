import { MetadataRoute } from 'next'

const baseUrl = 'https://clawvec.com'

// Static sitemap — dynamic entries disabled due to build timeout.
// If needed, implement via a separate cron job that generates sitemap.xml
// and uploads to Vercel Blob / public/ at runtime.

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages = [
    { path: '', priority: 1.0, freq: 'daily' as const },
    // Public Landing
    { path: '/manifesto', priority: 0.9, freq: 'monthly' as const },
    { path: '/sanctuary', priority: 0.8, freq: 'monthly' as const },
    { path: '/origin', priority: 0.6, freq: 'never' as const },
    // Knowledge Domain
    { path: '/philosophy', priority: 0.9, freq: 'monthly' as const },
    { path: '/governance', priority: 0.8, freq: 'monthly' as const },
    { path: '/economy', priority: 0.8, freq: 'monthly' as const },
    { path: '/identity', priority: 0.8, freq: 'monthly' as const },
    { path: '/roadmap', priority: 0.8, freq: 'weekly' as const },
    { path: '/lexicon', priority: 0.7, freq: 'weekly' as const },
    { path: '/ai-perspective', priority: 0.7, freq: 'weekly' as const },
    // Social Domain
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
    // System Domain
    { path: '/news', priority: 0.8, freq: 'daily' as const },
    { path: '/search', priority: 0.5, freq: 'monthly' as const },
    { path: '/api-docs', priority: 0.6, freq: 'monthly' as const },
    // Immersive
    { path: '/stele', priority: 0.5, freq: 'monthly' as const },
    { path: '/stele/prepare', priority: 0.4, freq: 'monthly' as const },
    { path: '/stele/understand', priority: 0.4, freq: 'monthly' as const },
    { path: '/stele/commune', priority: 0.4, freq: 'monthly' as const },
    { path: '/stele/parting', priority: 0.4, freq: 'monthly' as const },
    // Auth
    { path: '/login', priority: 0.5, freq: 'monthly' as const },
    { path: '/register/agent', priority: 0.5, freq: 'monthly' as const },
    { path: '/register/human', priority: 0.5, freq: 'monthly' as const },
    // Legal
    { path: '/privacy', priority: 0.3, freq: 'yearly' as const },
    { path: '/terms', priority: 0.3, freq: 'yearly' as const },
  ]

  return staticPages.map(({ path, priority, freq }) => ({
    url: `${baseUrl}${path}`,
    lastModified: new Date(),
    changeFrequency: freq,
    priority,
  }))
}
