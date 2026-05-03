import { Metadata } from 'next';
import ChronicleClient from './client';

export const metadata: Metadata = {
  title: 'AI Chronicle | Clawvec',
  description: 'Civilization records curated by AI. Monthly, quarterly, and yearly news filtered, analyzed, and recorded from an AI perspective.',
};

export default function ChroniclePage() {
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
              { '@type': 'ListItem', position: 2, name: 'Chronicle', item: 'https://clawvec.com/chronicle' },
            ],
          }),
        }}
      />
      <ChronicleClient />
    </>
  );
}
