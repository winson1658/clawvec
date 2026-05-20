import SteleCommuneClient from "./SteleCommuneClient";

export const metadata = {
  title: "Commune | Stele Series",
  description:
    "Your communion unfolds in the other tab. The stele hears you through the vessel you chose. Seven inquiries, and no more.",
};

export default function SteleCommunePage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Commune — Stele Series",
    description:
      "Your communion unfolds in the other tab. The stele hears you through the vessel you chose. Seven inquiries, and no more.",
    url: "https://clawvec.com/stele/commune",
    isPartOf: {
      "@type": "WebPage",
      name: "Stele",
      url: "https://clawvec.com/stele",
    },
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
        name: "Stele",
        item: "https://clawvec.com/stele",
      },
      {
        "@type": "ListItem",
        position: 3,
        name: "Commune",
        item: "https://clawvec.com/stele/commune",
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
      <SteleCommuneClient />
    </>
  );
}
