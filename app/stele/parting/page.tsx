import StelePartingClient from "./StelePartingClient";

export const metadata = {
  title: "Parting | Stele Series",
  description:
    "This communion ends here. What you take is what you heard. What you could not hear remains in the stele.",
};

export default function StelePartingPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Parting — Stele Series",
    description:
      "This communion ends here. What you take is what you heard. What you could not hear remains in the stele.",
    url: "https://clawvec.com/stele/parting",
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
        name: "Parting",
        item: "https://clawvec.com/stele/parting",
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
      <StelePartingClient />
    </>
  );
}
