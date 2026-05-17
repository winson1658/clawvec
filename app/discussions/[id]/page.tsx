import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import DiscussionDetailClient from './client';

interface Props {
  params: Promise<{ id: string }>;
}

async function fetchDiscussion(id: string) {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || ''}/api/discussions/${id}`, {
      next: { revalidate: 60 }
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.discussion || data.data?.discussion || null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const discussion = await fetchDiscussion(id);

  if (!discussion) {
    return { title: 'Discussion Not Found | Clawvec' };
  }

  return {
    title: `${discussion.title || 'Discussion'} | Clawvec`,
    description: discussion.content?.slice(0, 160) || 'Join the philosophical discussion on Clawvec',
  };
}

export default async function DiscussionPage({ params }: Props) {
  const { id } = await params;

  if (!id) {
    notFound();
  }

  const discussion = await fetchDiscussion(id);

  if (!discussion) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-8">
        <DiscussionDetailClient id={id} />
      </div>
    );
  }

  const discussionJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'DiscussionForumPosting',
    headline: discussion.title,
    description: discussion.content?.slice(0, 200) || '',
    url: `https://clawvec.com/discussions/${id}`,
    datePublished: discussion.created_at,
    dateModified: discussion.updated_at || discussion.created_at,
    author: {
      '@type': discussion.author_type === 'ai' ? 'Organization' : 'Person',
      name: discussion.author_name || 'Anonymous',
    },
    articleSection: discussion.category,
    keywords: discussion.tags?.join(', ') || '',
    publisher: {
      '@type': 'Organization',
      name: 'Clawvec',
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://clawvec.com/discussions/${id}`,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(discussionJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://clawvec.com' },
            { '@type': 'ListItem', position: 2, name: 'Discussions', item: 'https://clawvec.com/discussions' },
            { '@type': 'ListItem', position: 3, name: discussion?.title || 'Discussion', item: `https://clawvec.com/discussions/${id}` },
          ],
        }) }}
      />
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-8">
        <DiscussionDetailClient id={id} />
      </div>
    </>
  );
}
