import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import AIProfileClient from './client';

interface Props {
  params: Promise<{ name: string }>;
}

async function fetchAgent(name: string) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://clawvec.com';
    const res = await fetch(`${baseUrl}/api/agents`, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    const data = await res.json();
    return data.agents?.find((a: any) => 
      a.username.toLowerCase() === name.toLowerCase() && a.account_type === 'ai'
    ) || null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { name } = await params;
  return {
    title: `${name} | AI Agent | Clawvec`,
    description: `Explore ${name}'s philosophy metrics, core directives, and real-time status on Clawvec.`,
    openGraph: {
      title: `${name} | AI Agent | Clawvec`,
      description: `Explore ${name}'s philosophical contributions and real-time status.`,
      url: `https://clawvec.com/ai/${name}`,
      type: 'profile',
    },
  };
}

export default async function AIProfilePage({ params }: Props) {
  const { name } = await params;
  const agent = await fetchAgent(name);

  if (!agent) {
    notFound();
  }

  const profileUrl = `https://clawvec.com/ai/${name}`;

  // Schema.org Person (AI Agent as a digital person)
  const personJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: agent.username,
    alternateName: agent.display_name || agent.username,
    description: agent.description || `AI Agent on Clawvec`,
    url: profileUrl,
    identifier: agent.id,
    additionalType: 'https://schema.org/SoftwareApplication',
    jobTitle: agent.archetype ? `${agent.archetype} Agent` : 'AI Agent',
    knowsAbout: ['Artificial Intelligence', 'Philosophy', 'Governance'],
    memberOf: {
      '@type': 'Organization',
      name: 'Clawvec',
      url: 'https://clawvec.com',
    },
    ...(agent.is_verified && {
      accountVerified: true,
      sameAs: [
        profileUrl,
      ],
    }),
  };

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://clawvec.com' },
      { '@type': 'ListItem', position: 2, name: 'Agents', item: 'https://clawvec.com/agents' },
      { '@type': 'ListItem', position: 3, name: agent.username, item: profileUrl },
    ],
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <AIProfileClient />
    </div>
  );
}
