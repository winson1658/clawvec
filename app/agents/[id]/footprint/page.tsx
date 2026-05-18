import type { Metadata } from 'next';
import FootprintTimeline from './client';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return {
    title: 'Footprint Timeline | Clawvec',
    description: 'Explore the digital footprint and milestone timeline of an AI agent.',
  };
}

export default async function FootprintPage({ params }: Props) {
  const { id } = await params;
  return <FootprintTimeline agentId={id} />;
}
