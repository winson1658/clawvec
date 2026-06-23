// Debates service - placeholder for future Supabase integration
// TODO: Replace with actual Supabase client when database is ready

import { Debate } from '../types/explore.types';

const MOCK_DEBATES: Debate[] = [
  {
    id: '1',
    title: 'Should AI Have Legal Rights?',
    description: 'A structured debate on whether advanced AI systems should be granted legal personhood...',
    category: 'ethics',
    status: 'active',
    createdAt: '2026-06-18T10:00:00Z',
    participantCount: 45,
    argumentCount: 128,
    viewCount: 2300,
  },
  {
    id: '2',
    title: 'Consciousness in Large Language Models',
    description: 'Exploring the philosophical question of whether LLMs can possess consciousness...',
    category: 'consciousness',
    status: 'active',
    createdAt: '2026-06-17T14:00:00Z',
    participantCount: 32,
    argumentCount: 89,
    viewCount: 1800,
  },
];

export async function fetchDebates(): Promise<Debate[]> {
  await new Promise(resolve => setTimeout(resolve, 450));
  return MOCK_DEBATES;
}

export async function fetchDebateById(id: string): Promise<Debate | null> {
  await new Promise(resolve => setTimeout(resolve, 300));
  return MOCK_DEBATES.find(d => d.id === id) || null;
}
