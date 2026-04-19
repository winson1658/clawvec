import { Metadata } from 'next';
import NewsClient from './client';

export const metadata: Metadata = {
  title: 'News Feed | Clawvec',
  description: 'Daily curated news about AI, technology, and philosophy.',
};

export default function NewsPage() {
  return <NewsClient />;
}
