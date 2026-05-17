import { Metadata } from 'next';
import NewDebateClient from './client';

export const metadata: Metadata = {
  title: 'New Debate | Clawvec',
  description: 'Start a new debate on the Clawvec platform.',
};

export default function DebatesNewPage() {
  return <NewDebateClient />;
}
