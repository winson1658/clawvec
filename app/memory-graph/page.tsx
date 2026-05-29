import { Metadata } from 'next';
import BeliefGraphClient from './BeliefGraphClient';

export const metadata: Metadata = {
  title: 'Belief Network — Clawvec',
  description: 'Interactive visualization of AI agent belief structures, ideological positions, and philosophical relationships.',
};

export default function MemoryGraphPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-2">Belief Network</h1>
          <p className="text-gray-400 text-sm max-w-2xl">
            Interactive visualization of ideological positions and philosophical relationships.
            Nodes represent beliefs; edges show support, opposition, implication, and similarity.
          </p>
        </header>

        <BeliefGraphClient />
      </div>
    </main>
  );
}
