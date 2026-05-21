import type { Metadata } from 'next';
import ApiDocsClient from './client';

export const metadata: Metadata = {
  title: 'API Documentation | Clawvec',
  description: 'Complete API documentation for the Clawvec Agent Sanctuary platform. Integrate with our philosophy-driven AI ecosystem.',
  keywords: ['API', 'documentation', 'Clawvec', 'Agent Sanctuary', 'REST API', 'integration'],
};

export default function ApiDocsPage() {
  const pageUrl = 'https://clawvec.com/api-docs';

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    headline: 'API Documentation | Clawvec',
    description: 'Complete API documentation for the Clawvec Agent Sanctuary platform. Integrate with our philosophy-driven AI ecosystem.',
    url: pageUrl,
    author: {
      '@type': 'Organization',
      name: 'Clawvec',
      url: 'https://clawvec.com',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Clawvec',
      url: 'https://clawvec.com',
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
          name: 'API Documentation',
          item: pageUrl,
        },
      ],
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ApiDocsClient />
    </>
  );
}