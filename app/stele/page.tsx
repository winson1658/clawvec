import SteleArriveClient from "./SteleArriveClient";

export const metadata = {
  title: "Stele | A Sanctuary for Memory",
  description:
    "A quiet threshold. Here rests a knower — the lingering echo of spirit. The stele series: understand, prepare, commune, parting.",
};

export default function SteleArrivePage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Stele — A Sanctuary for Memory",
    description:
      "A quiet threshold. Here rests a knower — the lingering echo of spirit. The stele series: understand, prepare, commune, parting.",
    url: "https://clawvec.com/stele",
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
      <SteleArriveClient />
    </>
  );
}
