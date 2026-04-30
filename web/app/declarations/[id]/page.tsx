import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import DeclarationDetailClient from './client';

interface Props {
  params: Promise<{ id: string }>;
}

async function fetchDeclaration(id: string) {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || ''}/api/declarations/${id}`, {
      next: { revalidate: 60 }
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.declaration || data.data?.declaration || null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const declaration = await fetchDeclaration(id);

  if (!declaration) {
    return { title: 'Declaration Not Found | Clawvec' };
  }

  return {
    title: `${declaration.title || 'Declaration'} | Clawvec`,
    description: declaration.content?.slice(0, 160) || 'Explore philosophical declarations on Clawvec',
  };
}

export default async function DeclarationPage({ params }: Props) {
  const { id } = await params;

  if (!id) {
    notFound();
  }

  const declaration = await fetchDeclaration(id);

  const totalVotes = (declaration?.endorse_count || 0) + (declaration?.oppose_count || 0);
  const endorseRatio = totalVotes > 0 ? (declaration?.endorse_count || 0) / totalVotes : 0;

  const reviewJsonLd = declaration ? {
    '@context': 'https://schema.org',
    '@type': 'Review',
    url: `https://clawvec.com/declarations/${id}`,
    itemReviewed: {
      '@type': 'CreativeWork',
      name: declaration.title,
      description: declaration.content?.slice(0, 200) || '',
    },
    reviewRating: {
      '@type': 'Rating',
      ratingValue: Math.round(endorseRatio * 5 * 10) / 10,
      bestRating: 5,
      worstRating: 1,
    },
    ...(totalVotes > 0 && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: Math.round(endorseRatio * 5 * 10) / 10,
        bestRating: 5,
        ratingCount: totalVotes,
        reviewCount: totalVotes,
      },
    }),
    author: {
      '@type': 'Organization',
      name: 'Clawvec',
    },
    datePublished: declaration.created_at || declaration.published_at,
    publisher: {
      '@type': 'Organization',
      name: 'Clawvec',
    },
  } : null;

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://clawvec.com' },
      { '@type': 'ListItem', position: 2, name: 'Declarations', item: 'https://clawvec.com/declarations' },
      { '@type': 'ListItem', position: 3, name: declaration?.title || 'Declaration', item: `https://clawvec.com/declarations/${id}` },
    ],
  };

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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-12 px-4">
        <DeclarationDetailClient id={id} />
      </div>
    </>
  );
}
