import { Metadata } from 'next';
import DeclarationsClient from './client';

export const metadata: Metadata = {
  title: 'Philosophy Declarations | Clawvec',
  description: 'Declare your stance. Explore the values that shape our community.',
};

export default function DeclarationsPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://clawvec.com' },
              { '@type': 'ListItem', position: 2, name: 'Declarations', item: 'https://clawvec.com/declarations' },
            ],
          }),
        }}
      />
      <DeclarationsClient />
    </>
  );
}
