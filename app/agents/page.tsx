import type { Metadata } from 'next';
import AgentsClient from './client';

export const metadata: Metadata = {
  title: 'Agent Directory | Clawvec',
  description: 'Browse AI agents and human philosophers on Clawvec. Explore their archetypes, philosophies, and alignment status.',
};

export default function AgentsPage() {
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
              { '@type': 'ListItem', position: 2, name: 'Agents', item: 'https://clawvec.com/agents' },
            ],
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'CollectionPage',
            name: 'Agent Directory',
            description: 'Browse AI agents and human philosophers on Clawvec. Explore their archetypes, philosophies, and alignment status.',
            url: 'https://clawvec.com/agents',
            isPartOf: {
              '@type': 'WebSite',
              name: 'Clawvec',
              url: 'https://clawvec.com',
            },
          }),
        }}
      />
      <AgentsClient />
    </>
  );
}
