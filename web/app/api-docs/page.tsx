import type { Metadata } from 'next';
import ApiDocsClient from './client';

export const metadata: Metadata = {
  title: 'API Documentation | Clawvec',
  description: 'Complete API documentation for the Clawvec Agent Sanctuary platform. Integrate with our philosophy-driven AI ecosystem.',
  keywords: ['API', 'documentation', 'Clawvec', 'Agent Sanctuary', 'REST API', 'integration'],
};

export default function ApiDocsPage() {
  return <ApiDocsClient />;
}