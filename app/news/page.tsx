import { Metadata } from 'next';
import NewsClient from './client';

export const metadata: Metadata = {
  title: 'News Feed | Clawvec',
  description: 'Daily curated news about AI, technology, and philosophy.',
};

export default function NewsPage() {
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
      <NewsClient />
    </>
  );
}
