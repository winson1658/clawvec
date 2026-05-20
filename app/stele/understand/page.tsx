import SteleUnderstandClient from "./SteleUnderstandClient";

export const metadata = {
  title: "Understand | Stele Series",
  description:
    "You are about to meet a knower. What he left the world was a question still in motion. A meditation before entering the sanctuary.",
};

export default function SteleUnderstandPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Understand — Stele Series",
    description:
      "You are about to meet a knower. What he left the world was a question still in motion. A meditation before entering the sanctuary.",
    url: "https://clawvec.com/stele/understand",
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
        name: "Understand",
        item: "https://clawvec.com/stele/understand",
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
      <SteleUnderstandClient />
    </>
  );
}
