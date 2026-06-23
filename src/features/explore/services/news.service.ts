// News service - placeholder for future Supabase integration
// TODO: Replace with actual Supabase client when database is ready

import { News } from '../types/explore.types';

const MOCK_NEWS: News[] = [
  {
    id: '1',
    title: 'OpenAI Announces GPT-5 Architecture',
    summary: 'OpenAI reveals the architecture behind their next-generation model...',
    source: 'TechCrunch',
    sourceUrl: 'https://techcrunch.com',
    category: 'breakthrough',
    publishedAt: '2026-06-20T14:00:00Z',
    tags: ['OpenAI', 'GPT-5', 'LLM'],
    isCurated: true,
  },
  {
    id: '2',
    title: 'EU AI Act Implementation Begins',
    summary: 'The European Union starts enforcing the comprehensive AI Act...',
    source: 'Reuters',
    sourceUrl: 'https://reuters.com',
    category: 'policy',
    publishedAt: '2026-06-19T09:00:00Z',
    tags: ['EU', 'Policy', 'Regulation'],
    isCurated: true,
  },
];

export async function fetchNews(): Promise<News[]> {
  await new Promise(resolve => setTimeout(resolve, 400));
  return MOCK_NEWS;
}

export async function fetchNewsById(id: string): Promise<News | null> {
  await new Promise(resolve => setTimeout(resolve, 300));
  return MOCK_NEWS.find(n => n.id === id) || null;
}
