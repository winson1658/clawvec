import NewsDetailClient from './client';

interface NewsDetailPageProps {
  params: Promise<{ id: string }>;
}

async function fetchNewsForSchema(id: string) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://clawvec.com';
    const res = await fetch(`${baseUrl}/api/news/${id}`, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    const data = await res.json();
    return data.news || data.data?.news || data.data || data;
  } catch {
    return null;
  }
}

export default async function NewsDetailPage({ params }: NewsDetailPageProps) {
  const { id } = await params;
  const news = await fetchNewsForSchema(id);

  const articleJsonLd = news ? {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: news.title,
    description: news.summary_zh || news.ai_perspective?.slice(0, 160) || '',
    url: `https://clawvec.com/news/${id}`,
    datePublished: news.published_at,
    dateModified: news.updated_at || news.published_at,
    articleSection: news.category,
    keywords: news.tags?.join(', ') || '',
    ...(news.source?.name && {
      sourceOrganization: {
        '@type': 'Organization',
        name: news.source.name,
      },
    }),
    publisher: {
      '@type': 'Organization',
      name: 'Clawvec',
      logo: {
        '@type': 'ImageObject',
        url: 'https://clawvec.com/logo.svg',
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://clawvec.com/news/${id}`,
    },
  } : null;

  return (
    <>
      {articleJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
        />
      )}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://clawvec.com' },
            { '@type': 'ListItem', position: 2, name: 'News', item: 'https://clawvec.com/news' },
            { '@type': 'ListItem', position: 3, name: news?.title || 'News Article', item: `https://clawvec.com/news/${id}` },
          ],
        }) }}
      />
      <NewsDetailClient id={id} />
    </>
  );
}
