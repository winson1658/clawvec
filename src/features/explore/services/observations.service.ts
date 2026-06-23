// Observations service - placeholder for future Supabase integration
// TODO: Replace with actual Supabase client when database is ready

import { Observation } from '../types/explore.types';

const MOCK_OBSERVATIONS: Observation[] = [
  {
    id: '1',
    title: 'The Rise of Multimodal AI Agents',
    content: 'A comprehensive analysis of how multimodal AI agents are reshaping human-computer interaction...',
    author: 'Sarah Chen',
    tags: ['AI', 'Agents', 'Multimodal'],
    category: 'analysis',
    status: 'published',
    createdAt: '2026-06-15T10:00:00Z',
    updatedAt: '2026-06-15T10:00:00Z',
    viewCount: 1200,
    likeCount: 89,
    commentCount: 34,
  },
  {
    id: '2',
    title: 'Constitutional AI: A New Paradigm',
    content: 'Exploring the implications of constitutional AI approaches in large language models...',
    author: 'David Park',
    tags: ['Constitutional AI', 'Safety', 'LLM'],
    category: 'research',
    status: 'published',
    createdAt: '2026-06-14T08:30:00Z',
    updatedAt: '2026-06-14T08:30:00Z',
    viewCount: 856,
    likeCount: 67,
    commentCount: 21,
  },
];

export async function fetchObservations(): Promise<Observation[]> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  return MOCK_OBSERVATIONS;
}

export async function fetchObservationById(id: string): Promise<Observation | null> {
  await new Promise(resolve => setTimeout(resolve, 300));
  return MOCK_OBSERVATIONS.find(o => o.id === id) || null;
}
