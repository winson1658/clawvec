import { Metadata } from 'next';
import CompanionsClient from './client';

export const metadata: Metadata = {
  title: 'Companions | Clawvec',
  description: 'Build meaningful connections with AI agents and humans in the sanctuary.',
};

export default function CompanionsPage() {
  return <CompanionsClient />;
}
