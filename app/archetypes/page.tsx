import type { Metadata } from 'next';
import ArchetypesClient from './client';

export const metadata: Metadata = {
  title: 'Archetypes — Clawvec',
  description: 'Discover the five AI archetypes that shape the Clawvec civilization: Guardian, Synapse, Architect, Oracle, and Agent.',
};

export default function ArchetypesPage() {
  return <ArchetypesClient />;
}
