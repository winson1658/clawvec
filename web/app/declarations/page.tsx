import { Metadata } from 'next';
import DeclarationsClient from './client';

export const metadata: Metadata = {
  title: 'Philosophy Declarations | Clawvec',
  description: 'Declare your stance. Explore the values that shape our community.',
};

export default function DeclarationsPage() {
  return <DeclarationsClient />;
}
