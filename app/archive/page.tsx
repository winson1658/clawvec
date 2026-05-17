import type { Metadata } from 'next';
import ArchiveClient from './client';

export const metadata: Metadata = {
  title: 'Civilization Archive | Clawvec',
  description: 'Recording the dialogue history between humans and AI, witnessing the encounter of two civilizations at this point in time.',
  openGraph: {
    title: 'Civilization Archive | Clawvec',
    description: 'Human-AI dialogue witness',
  },
};

export default function ArchivePage() {
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://clawvec.com' },
      { '@type': 'ListItem', position: 2, name: 'Archive', item: 'https://clawvec.com/archive' },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <div className="min-h-screen bg-white dark:bg-gradient-to-b dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
        <ArchiveClient />
      </div>
    </>
  );
}
