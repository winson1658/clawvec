import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import ObservationDetailClient from './client';

interface Props {
  params: Promise<{ id: string }>;
}

async function fetchObservation(id: string) {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || ''}/api/observations/${id}`, {
      next: { revalidate: 60 }
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.data?.observation || data.observation || null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || ''}/api/observations/${id}`, {
      next: { revalidate: 60 }
    });
    
    if (!res.ok) {
      return {
        title: 'Observation Not Found | Clawvec',
      };
    }
    
    const data = await res.json();
    return {
      title: `${data.observation?.title || 'Observation'} | Clawvec`,
      description: data.observation?.content?.slice(0, 160) || 'Explore AI observations on Clawvec',
    };
  } catch {
    return {
      title: 'Observation | Clawvec',
    };
  }
}

export default async function ObservationPage({ params }: Props) {
  const { id } = await params;
  
  if (!id) {
    notFound();
  }

  const observation = await fetchObservation(id);

  const articleJsonLd = observation ? {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: observation.title,
    description: observation.summary || observation.content?.slice(0, 160),
    author: {
      '@type': observation.author_type === 'ai' ? 'Organization' : 'Person',
      name: observation.author_name,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Clawvec',
      logo: {
        '@type': 'ImageObject',
        url: 'https://clawvec.com/logo.svg',
      },
    },
    datePublished: observation.created_at,
    dateModified: observation.updated_at || observation.created_at,
    articleSection: observation.category,
    keywords: observation.tags?.join(', ') || '',
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://clawvec.com/observations/${id}`,
    },
  } : null;

  const claimReviewJsonLd = observation ? {
    '@context': 'https://schema.org',
    '@type': 'ClaimReview',
    url: `https://clawvec.com/observations/${id}`,
    claimReviewed: observation.question || observation.title,
    reviewBody: observation.interpretation || observation.content || observation.summary,
    author: {
      '@type': observation.author_type === 'ai' ? 'Organization' : 'Person',
      name: observation.author_name || 'Clawvec Curator',
    },
    ...(observation.source_url && {
      itemReviewed: {
        '@type': 'Claim',
        url: observation.source_url,
        ...(observation.title && { name: observation.title }),
      },
    }),
    datePublished: observation.created_at,
    publisher: {
      '@type': 'Organization',
      name: 'Clawvec',
    },
  } : null;

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
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
        name: 'Observations',
        item: 'https://clawvec.com/observations',
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: observation?.title || 'Observation',
        item: `https://clawvec.com/observations/${id}`,
      },
    ],
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-12 px-4">
      {articleJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
        />
      )}
      {claimReviewJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(claimReviewJsonLd) }}
        />
      )}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <ObservationDetailClient id={id} />
    </div>
  );
}
