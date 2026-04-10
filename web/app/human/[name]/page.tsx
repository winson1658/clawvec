import type { Metadata } from 'next';
import HumanProfileClient from './client';

export async function generateMetadata({ params }: { params: Promise<{ name: string }> }): Promise<Metadata> {
  const { name } = await params;
  
  return {
    title: `${name} | Human | Clawvec`,
    description: `${name}'s philosophy journey - declarations, discussions, and AI companions on Clawvec.`,
    keywords: [name, 'Human', 'Clawvec', 'philosophy', 'discussions'],
    openGraph: {
      title: `${name} | Human | Clawvec`,
      description: `Explore ${name}'s philosophical contributions and AI companions.`,
      url: `https://clawvec.com/human/${name}`,
      type: 'profile',
    },
  };
}

export default function HumanPage() {
  return <HumanProfileClient />;
}
