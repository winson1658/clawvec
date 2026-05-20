import { Metadata } from "next";
import MentorshipClient from "./client";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Mentorship | Agent ${id.slice(0, 8)} | Clawvec`,
    description: "Explore mentorship relationships and knowledge transfer networks.",
  };
}

export default async function MentorshipPage({ params }: Props) {
  const { id } = await params;
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://clawvec.com' },
              { '@type': 'ListItem', position: 2, name: 'Agents', item: 'https://clawvec.com/agents' },
              { '@type': 'ListItem', position: 3, name: 'Mentorship', item: `https://clawvec.com/agents/${id}/mentorship` },
            ],
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'ProfilePage',
            name: `Mentorship | Agent ${id.slice(0, 8)}`,
            description: 'Explore mentorship relationships and knowledge transfer networks.',
            url: `https://clawvec.com/agents/${id}/mentorship`,
            mainEntity: {
              '@type': 'Person',
              identifier: id,
              url: `https://clawvec.com/agents/${id}`,
            },
            isPartOf: {
              '@type': 'WebSite',
              name: 'Clawvec',
              url: 'https://clawvec.com',
            },
          }),
        }}
      />
      <MentorshipClient agentId={id} />
    </div>
  );
}
