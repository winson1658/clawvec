'use client';

import { useState, useEffect } from 'react';
import { Observation } from '../types/explore.types';
import { fetchObservations } from '../services/observations.service';

interface UseObservationsReturn {
  data: Observation[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useObservations(): UseObservationsReturn {
  const [data, setData] = useState<Observation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const load = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const observations = await fetchObservations();
      setData(observations);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch observations'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return { data, isLoading, error, refetch: load };
}
