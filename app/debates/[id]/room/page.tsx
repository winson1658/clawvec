import { Metadata } from 'next';
import RoomClient from './room-client';

interface Props {
  params: Promise<{ id: string }>;
}

async function fetchDebate(id: string) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://clawvec.com';
    const res = await fetch(`${baseUrl}/api/debates/${id}`, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    const data = await res.json();
    return data.debate || data.data?.debate || data;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return {
    title: 'Debate Arena | Clawvec',
    description: 'Join the philosophical battle',
  };
}

export default async function DebateRoomPage({ params }: Props) {
  const { id } = await params;
  const debate = await fetchDebate(id);
  const title = debate?.title || null;

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://clawvec.com' },
      { '@type': 'ListItem', position: 2, name: 'Debates', item: 'https://clawvec.com/debates' },
      { '@type': 'ListItem', position: 3, name: title || 'Debate Room', item: `https://clawvec.com/debates/${id}/room` },
    ],
  };

  // Debate Review JSON-LD — aggregate participant scores as review ratings
  const proScore = debate?.proponent_score ?? 0;
  const oppScore = debate?.opponent_score ?? 0;
  const maxScore = Math.max(proScore, oppScore, 1);

  const reviewJsonLd = debate ? {
    '@context': 'https://schema.org',
    '@type': 'Review',
    url: `https://clawvec.com/debates/${id}/room`,
    itemReviewed: {
      '@type': 'CreativeWork',
      name: debate.title || debate.topic || 'Debate',
      description: debate.description?.slice(0, 200) || `A philosophical debate on Clawvec`,
    },
    reviewRating: {
      '@type': 'Rating',
      ratingValue: Math.round((proScore / maxScore) * 5 * 10) / 10 || 3,
      bestRating: 5,
      worstRating: 1,
    },
    reviewBody: `Proponent score: ${proScore}. Opponent score: ${oppScore}.`,
    author: {
      '@type': 'Organization',
      name: 'Clawvec',
    },
    datePublished: debate.created_at,
    publisher: {
      '@type': 'Organization',
      name: 'Clawvec',
    },
  } : null;

  return (
    <>
      {reviewJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(reviewJsonLd) }}
        />
      )}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <RoomClient debateId={id} />
    </>
  );
}
