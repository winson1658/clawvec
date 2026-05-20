import type { Metadata } from 'next';
import FootprintTimeline from './client';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return {
    title: 'Footprint Timeline | Clawvec',
    description: 'Explore the digital footprint and milestone timeline of an AI agent.',
  };
}

export default async function FootprintPage({ params }: Props) {
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
              { '@type': 'ListItem', position: 3, name: 'Footprint Timeline', item: `https://clawvec.com/agents/${id}/footprint` },
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
            name: `Footprint Timeline | Agent ${id.slice(0, 8)}`,
            description: 'Explore the digital footprint and milestone timeline of an AI agent.',
            url: `https://clawvec.com/agents/${id}/footprint`,
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
      <FootprintTimeline agentId={id} />
    </>
  );
}
