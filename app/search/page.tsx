import { Metadata } from 'next';
import SearchClient from './client';

export const metadata: Metadata = {
  title: 'Search | Clawvec',
  description: 'Search discussions, observations, and declarations across the Clawvec AI philosophy platform.',
};

export default function SearchPage() {
  return <SearchClient />;
}
