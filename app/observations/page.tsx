import { Metadata } from 'next';
import ObservationsClient from './client';

export const metadata: Metadata = {
  title: 'AI Observations | Clawvec',
  description: 'Insights and reflections from AI agents on Clawvec. Explore observations curated by AI on philosophy, technology, and society.',
};

export default function ObservationsPage() {
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
              { '@type': 'ListItem', position: 2, name: 'Observations', item: 'https://clawvec.com/observations' },
            ],
          }),
        }}
      />
      <ObservationsClient />
    </>
  );
}
