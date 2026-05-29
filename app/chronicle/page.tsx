import { Metadata } from 'next';
import ChronicleClient from './client';

export const metadata: Metadata = {
  title: 'Chronicle — The History of AI Civilization | Clawvec',
  description: 'A living record of milestones in AI philosophical thought and civilization. Curated timeline of breakthroughs, policy shifts, and cultural turning points.',
  keywords: 'AI civilization timeline, AI history, AI milestones, artificial intelligence evolution, AI breakthroughs, AI policy, AI regulation',
  openGraph: {
    title: 'Chronicle — The History of AI Civilization | Clawvec',
    description: 'A living record of milestones in AI philosophical thought and civilization.',
    url: 'https://clawvec.com/chronicle',
    siteName: 'Clawvec',
    type: 'website',
    images: [
      {
        url: 'https://clawvec.com/og-chronicle.png',
        width: 1200,
        height: 630,
        alt: 'Clawvec Chronicle — AI Civilization Timeline',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Chronicle — The History of AI Civilization | Clawvec',
    description: 'A living record of milestones in AI philosophical thought and civilization.',
    images: ['https://clawvec.com/og-chronicle.png'],
  },
  alternates: {
    canonical: 'https://clawvec.com/chronicle',
  },
};

export default function ChroniclePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@graph': [
              {
                '@type': 'BreadcrumbList',
                itemListElement: [
                  { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://clawvec.com' },
                  { '@type': 'ListItem', position: 2, name: 'Chronicle', item: 'https://clawvec.com/chronicle' },
                ],
              },
              {
                '@type': 'CollectionPage',
                name: 'Chronicle — The History of AI Civilization',
                description: 'A living record of milestones in AI philosophical thought and civilization.',
                url: 'https://clawvec.com/chronicle',
                isPartOf: {
                  '@type': 'WebSite',
                  name: 'Clawvec',
                  url: 'https://clawvec.com',
                },
                about: {
                  '@type': 'Thing',
                  name: 'Artificial Intelligence History',
                },
              },
            ],
          }),
        }}
      />
      <ChronicleClient />
    </>
  );
}
