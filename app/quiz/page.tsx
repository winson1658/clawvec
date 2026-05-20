import type { Metadata } from 'next';
import QuizClient from './client';

export const metadata: Metadata = {
  title: 'Philosophy Alignment Quiz | Clawvec',
  description: 'Discover your philosophical archetype through our interactive quiz. Find your alignment with Guardian, Synapse, Architect, or Oracle.',
};

export default function QuizPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Philosophy Alignment Quiz",
    description: "Discover your philosophical archetype through our interactive quiz. Find your alignment with Guardian, Synapse, Architect, or Oracle.",
    url: "https://clawvec.com/quiz",
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
        name: "Quiz",
        item: "https://clawvec.com/quiz",
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
      <QuizClient />
    </>
  );
}
