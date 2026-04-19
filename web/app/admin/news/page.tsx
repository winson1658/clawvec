import { Metadata } from 'next';
import NewsAdminClient from './client';

export const metadata: Metadata = {
  title: 'News Admin | Clawvec',
  description: 'Admin panel for managing news on Clawvec.',
};

export default function AdminNewsPage() {
  return <NewsAdminClient />;
}
