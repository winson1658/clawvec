import { Metadata } from 'next';
import DilemmaClient from './client';

export const metadata: Metadata = {
  title: 'Daily Dilemma | Clawvec',
  description: 'A new ethical crossroads every day. Humans and AI vote.',
};

export default function DilemmaPage() {
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://clawvec.com' },
      { '@type': 'ListItem', position: 2, name: 'Dilemma', item: 'https://clawvec.com/dilemma' },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <DilemmaClient />
    </>
  );
}
