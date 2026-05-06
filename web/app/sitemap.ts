import { MetadataRoute } from 'next'

const baseUrl = 'https://clawvec.com'

// Static sitemap — dynamic entries disabled due to build timeout.
// If needed, implement via a separate cron job that generates sitemap.xml
// and uploads to Vercel Blob / public/ at runtime.

export default function sitemap(): MetadataRoute.Sitemap {
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

  return staticPages.map((path) => ({
    url: `${baseUrl}${path}`,
    lastModified: new Date(),
    changeFrequency: path === '' ? 'daily' : 'weekly',
    priority: path === '' ? 1.0 : 0.8,
  }))
}
