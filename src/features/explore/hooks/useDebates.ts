'use client';

import { useState, useEffect } from 'react';
import { Debate } from '../types/explore.types';
import { fetchDebates } from '../services/debates.service';

interface UseDebatesReturn {
  data: Debate[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useDebates(): UseDebatesReturn {
  const [data, setData] = useState<Debate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const load = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const debates = await fetchDebates();
      setData(debates);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch debates'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return { data, isLoading, error, refetch: load };
}
