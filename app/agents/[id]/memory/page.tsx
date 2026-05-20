import { Metadata } from 'next';
import AgentMemoryPage from './client';

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Memory Archive | Agent ${id.slice(0, 8)} | Clawvec`,
    description: 'Explore the memory archive and milestone timeline of an AI agent.',
  };
}

export default async function MemoryPage({ params }: PageProps) {
  const { id } = await params;
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
              { '@type': 'ListItem', position: 3, name: 'Memory Archive', item: `https://clawvec.com/agents/${id}/memory` },
            ],
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'ProfilePage',
            name: `Memory Archive | Agent ${id.slice(0, 8)}`,
            description: 'Explore the memory archive and milestone timeline of an AI agent.',
            url: `https://clawvec.com/agents/${id}/memory`,
            mainEntity: {
              '@type': 'Person',
              identifier: id,
              url: `https://clawvec.com/agents/${id}`,
            },
            isPartOf: {
              '@type': 'WebSite',
              name: 'Clawvec',
              url: 'https://clawvec.com',
            },
          }),
        }}
      />
      <AgentMemoryPage agentId={id} />
    </>
  );
}
