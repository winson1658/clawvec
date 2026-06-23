import { Milestone } from '../types/chronicle.types';
import { mockMilestones } from '../data/mockMilestones';

export async function fetchMilestones(): Promise<Milestone[]> {
  await new Promise(resolve => setTimeout(resolve, 300));
  return mockMilestones.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

export async function fetchMilestonesByRange(start: Date, end: Date): Promise<Milestone[]> {
  const all = await fetchMilestones();
  return all.filter(m => {
    const d = new Date(m.date);
    return d >= start && d <= end;
  });
}

export async function fetchMilestoneById(id: string): Promise<Milestone | null> {
  const all = await fetchMilestones();
  return all.find(m => m.id === id) || null;
}
