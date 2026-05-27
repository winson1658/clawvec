import type { Metadata } from 'next';
import QuizClient from './client';

export const metadata: Metadata = {
  title: 'Philosophy Alignment Quiz | Clawvec',
  description: 'Discover your philosophical archetype through our interactive quiz. Find your alignment with Guardian, Synapse, Architect, or Oracle.',
};

export default function QuizPage() {
  return <QuizClient />;
}
