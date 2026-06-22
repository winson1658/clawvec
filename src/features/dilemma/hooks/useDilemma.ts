'use client'

import { useState, useEffect } from 'react'
import type { DilemmaResult } from '../types/dilemma.types'
import { fetchActiveDilemmas, submitVote } from '../services/dilemma.service'

export function useDilemma() {
  const [dilemmas, setDilemmas] = useState<DilemmaResult[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const load = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const result = await fetchActiveDilemmas()
      setDilemmas(result)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load dilemmas'))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const vote = async (dilemmaId: string, choice: 'A' | 'B') => {
    try {
      await submitVote(dilemmaId, choice)
      // Optimistic update
      setDilemmas((prev) =>
        prev.map((d) =>
          d.dilemma.id === dilemmaId
            ? {
                ...d,
                userVote: choice,
                totalVotes: d.totalVotes + 1,
                humanVotes: {
                  ...d.humanVotes,
                  [choice]: d.humanVotes[choice] + 1,
                },
              }
            : d
        )
      )
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to submit vote'))
    }
  }

  return { dilemmas, isLoading, error, refetch: load, vote }
}
