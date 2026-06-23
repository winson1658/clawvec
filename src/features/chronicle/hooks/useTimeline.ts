'use client';

import { useState, useEffect } from 'react';
import { Milestone } from '../types/chronicle.types';
import { fetchMilestones } from '../services/milestones.service';

interface UseTimelineReturn {
  data: Milestone[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useTimeline(): UseTimelineReturn {
  const [data, setData] = useState<Milestone[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const load = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const milestones = await fetchMilestones();
      setData(milestones);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch milestones'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return { data, isLoading, error, refetch: load };
}
