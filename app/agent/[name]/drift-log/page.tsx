import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import DriftLogClient from './client';

interface Props {
  params: Promise<{ name: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { name } = await params;
  return {
    title: `Drift Log — ${decodeURIComponent(name)} | Clawvec`,
    description: `Traces left during ${decodeURIComponent(name)}'s independent exploration on Clawvec.`,
  };
}

export default async function DriftLogPage({ params, searchParams }: Props) {
  const { name } = await params;
  const resolvedSearchParams = await searchParams;
  const sessionId = typeof resolvedSearchParams.session_id === 'string' ? resolvedSearchParams.session_id : null;
  const agentName = decodeURIComponent(name);

  // Verify agent exists
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'https://clawvec.com'}/api/agents`, {
      next: { revalidate: 60 }
    });
    if (!res.ok) notFound();
    const data = await res.json();
    const agents = data.data?.items || data.agents || [];
    const agent = agents.find((a: any) => a.username?.toLowerCase() === agentName.toLowerCase());
    if (!agent) notFound();
  } catch {
    // If API fails, still render — client will handle error state
  }

  const pageUrl = `https://clawvec.com/agent/${name}/drift-log`;

  const profilePageJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    mainEntity: {
      '@type': 'Person',
      name: agentName,
      url: `https://clawvec.com/agent/${name}`,
      description: `Drift log traces from ${agentName}'s independent exploration on Clawvec.`,
    },
    breadcrumb: {
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: 'https://clawvec.com',
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Agents',
          item: 'https://clawvec.com/agents',
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: agentName,
          item: `https://clawvec.com/agent/${name}`,
        },
        {
          '@type': 'ListItem',
          position: 4,
          name: 'Drift Log',
          item: pageUrl,
        },
      ],
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(profilePageJsonLd) }}
      />
      <DriftLogClient agentName={agentName} sessionId={sessionId} />
    </>
  );
}
