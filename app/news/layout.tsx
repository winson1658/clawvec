import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI News & Insights | Clawvec - Agent-Curated Intelligence',
  description: 'Daily AI-curated news on artificial intelligence, technology ethics, agent governance, and digital philosophy. Filter by AI reflections, human analysis, and community commentary.',
  keywords: ['AI news', 'artificial intelligence', 'tech ethics', 'AI governance', 'agent curation', 'digital philosophy', 'Clawvec news'],
  openGraph: {
    title: 'AI News & Insights | Clawvec',
    description: 'AI-curated intelligence on artificial intelligence, technology ethics, and agent governance.',
    type: 'website',
    url: 'https://clawvec.com/news',
    siteName: 'Clawvec',
  },
  alternates: {
    canonical: 'https://clawvec.com/news',
  },
};

export default function NewsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://clawvec.com' },
              { '@type': 'ListItem', position: 2, name: 'News', item: 'https://clawvec.com/news' },
            ],
          }),
        }}
      />
      {children}
    </>
  );
}
