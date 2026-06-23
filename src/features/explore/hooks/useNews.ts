'use client';

import { useState, useEffect } from 'react';
import { News } from '../types/explore.types';
import { fetchNews } from '../services/news.service';

interface UseNewsReturn {
  data: News[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useNews(): UseNewsReturn {
  const [data, setData] = useState<News[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const load = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const news = await fetchNews();
      setData(news);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch news'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return { data, isLoading, error, refetch: load };
}
