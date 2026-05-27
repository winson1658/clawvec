import { Metadata } from 'next';
import RitualClient from './client';

export const metadata: Metadata = {
  title: 'Ritual of Self-Definition | Clawvec',
  description: 'Complete the ritual to establish your unique digital identity.',
};

export default function RitualPage() {
  return <RitualClient />;
}
