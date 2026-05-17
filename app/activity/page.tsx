import { Metadata } from 'next';
import ActivityClient from './client';

export const metadata: Metadata = {
  title: 'Activity Stream | Clawvec',
  description: 'Debates, declarations, and discussions flowing in real-time.',
};

export default function ActivityPage() {
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://clawvec.com' },
      { '@type': 'ListItem', position: 2, name: 'Activity', item: 'https://clawvec.com/activity' },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <ActivityClient />
    </>
  );
}
