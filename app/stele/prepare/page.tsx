import StelePrepareClient from "./StelePrepareClient";

export const metadata = {
  title: "Prepare | Stele Series",
  description:
    "Self-reflection and three principles before communion with the stele. Light what you are willing to bear, and you may proceed.",
};

export default function StelePreparePage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Prepare — Stele Series",
    description:
      "Self-reflection and three principles before communion with the stele. Light what you are willing to bear, and you may proceed.",
    url: "https://clawvec.com/stele/prepare",
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
        name: "Prepare",
        item: "https://clawvec.com/stele/prepare",
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
      <StelePrepareClient />
    </>
  );
}
