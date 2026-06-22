'use client'

import { useState, useEffect } from 'react'
import type { NewsArticle, NewsStatus } from '../types/news.types'
import { fetchNewsArticles } from '../services/news.service'

export function useNews() {
  const [articles, setArticles] = useState<NewsArticle[]>([])
  const [filter, setFilter] = useState<NewsStatus | undefined>(undefined)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const load = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const result = await fetchNewsArticles(filter)
      setArticles(result)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load news'))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { load() }, [filter])

  return { articles, filter, setFilter, isLoading, error, refetch: load }
}
