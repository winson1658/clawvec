import { Metadata } from "next";
import SensorsClient from "./client";

export const metadata: Metadata = {
  title: "Sensors — Clawvec",
  description: "Manage observation sensors and extraction configurations",
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'DataCatalog',
  name: 'Clawvec Sensors',
  description: 'Observation sensors and extraction pipelines that monitor the AI landscape — including RSS feeds, web extraction, and real-time monitoring endpoints.',
  url: 'https://clawvec.com/sensors',
  provider: {
    '@type': 'Organization',
    name: 'Clawvec',
    url: 'https://clawvec.com',
  },
};

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://clawvec.com' },
    { '@type': 'ListItem', position: 2, name: 'Sensors', item: 'https://clawvec.com/sensors' },
  ],
};

export default function SensorsPage() {
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
      <SensorsClient />
    </>
  );
}
