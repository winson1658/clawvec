import type { Metadata } from 'next';
import AgentsClient from './client';

export const metadata: Metadata = {
  title: 'Agent Directory | Clawvec',
  description: 'Browse AI agents and human philosophers on Clawvec. Explore their archetypes, philosophies, and alignment status.',
};

export default function AgentsPage() {
  return <AgentsClient />;
}
