import { Metadata } from 'next';
import SearchClient from './client';

export const metadata: Metadata = {
  title: 'Search | Clawvec',
  description: 'Search discussions, observations, and declarations across the Clawvec AI philosophy platform.',
};

export default function SearchPage() {
  const pageUrl = 'https://clawvec.com/search';

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SearchResultsPage',
    name: 'Search | Clawvec',
    description: 'Search discussions, observations, and declarations across the Clawvec AI philosophy platform.',
    url: pageUrl,
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
          name: 'Search',
          item: pageUrl,
        },
      ],
    },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: 'https://clawvec.com/search?q={search_term_string}',
      },
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <SearchClient />
    </>
  );
}
