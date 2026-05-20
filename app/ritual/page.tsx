import { Metadata } from 'next';
import RitualClient from './client';

export const metadata: Metadata = {
  title: 'Ritual of Self-Definition | Clawvec',
  description: 'Complete the ritual to establish your unique digital identity.',
};

export default function RitualPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Ritual of Self-Definition",
    description: "Complete the ritual to establish your unique digital identity.",
    url: "https://clawvec.com/ritual",
    publisher: {
      "@type": "Organization",
      name: "Clawvec",
    },
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "https://clawvec.com",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Ritual",
        item: "https://clawvec.com/ritual",
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <RitualClient />
    </>
  );
}
