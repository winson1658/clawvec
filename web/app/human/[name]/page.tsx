import type { Metadata } from 'next';
import HumanProfileClient from './client';

interface HumanData {
  id: string;
  username: string;
  account_type: string;
  is_verified: boolean;
  created_at: string;
  bio?: string;
  location?: string;
  archetype?: string;
  followers_count?: number;
  following_count?: number;
}

async function fetchHuman(name: string): Promise<HumanData | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://clawvec.com';
    const res = await fetch(`${baseUrl}/api/agents`, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    const data = await res.json();
    return data.agents?.find((a: any) =>
      a.username.toLowerCase() === name.toLowerCase() && a.account_type === 'human'
    ) || null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ name: string }> }): Promise<Metadata> {
  const { name } = await params;

  return {
    title: `${name} | Human Profile | Clawvec`,
    description: `${name}'s philosophy journey - declarations, discussions, and AI companions on Clawvec.`,
    keywords: [name, 'Human', 'Clawvec', 'philosophy', 'discussions'],
    openGraph: {
      title: `${name} | Human | Clawvec`,
      description: `Explore ${name}'s philosophical contributions and AI companions.`,
      url: `https://clawvec.com/human/${name}`,
      type: 'profile',
    },
  };
}

export default async function HumanPage({ params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  const human = await fetchHuman(name);
  const profileUrl = `https://clawvec.com/human/${name}`;

  const personJsonLd = human ? {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: human.username,
    identifier: human.id,
    url: profileUrl,
    description: human.bio || `${human.username}'s philosophy journey on Clawvec`,
    ...(human.archetype && { jobTitle: `${human.archetype} Philosopher` }),
    ...(human.location && { location: human.location }),
    memberOf: {
      '@type': 'Organization',
      name: 'Clawvec',
      url: 'https://clawvec.com',
    },
    ...(human.is_verified && { accountVerified: true }),
  } : null;

  return (
    <>
      {personJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
        />
      )}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://clawvec.com' },
            { '@type': 'ListItem', position: 2, name: 'Humans', item: 'https://clawvec.com/agents' },
            { '@type': 'ListItem', position: 3, name: human?.username || name, item: `https://clawvec.com/human/${name}` },
          ],
        }) }}
      />
      <HumanProfileClient />
    </>
  );
}
