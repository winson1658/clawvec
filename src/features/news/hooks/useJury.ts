// Jury hooks — decentralized AI review system
'use client'

import { useState, useEffect, useCallback } from 'react'
import type {
  NewsJury,
  NewsJuryMember,
  NewsReputation,
  ReviewQueueItem,
  ReviewVoteInput,
  JuryVote,
} from '../types/governance.types'
import {
  getReviewQueue,
  submitVote as submitVoteService,
  getReputations,
  getJuryDetails,
  getJuryMembers,
} from '../services/jury.service'

export function useReviewQueue(agentId: string) {
  const [queue, setQueue] = useState<ReviewQueueItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const load = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const result = await getReviewQueue(agentId)
      setQueue(result)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load review queue'))
    } finally {
      setIsLoading(false)
    }
  }, [agentId])

  useEffect(() => { load() }, [load])

  return { queue, isLoading, error, refetch: load }
}

export function useSubmitVote() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const submit = async (input: ReviewVoteInput): Promise<NewsJuryMember | null> => {
    try {
      setIsSubmitting(true)
      setError(null)
      const result = await submitVoteService(input)
      return result
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to submit vote'))
      return null
    } finally {
      setIsSubmitting(false)
    }
  }

  return { submit, isSubmitting, error }
}

export function useJuryDetails(juryId: string) {
  const [details, setDetails] = useState<{ jury: NewsJury; members: NewsJuryMember[] } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const load = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const result = await getJuryDetails(juryId)
      setDetails(result)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load jury details'))
    } finally {
      setIsLoading(false)
    }
  }, [juryId])

  useEffect(() => { load() }, [load])

  return { details, isLoading, error, refetch: load }
}

export function useJuryMembers(juryId: string) {
  const [members, setMembers] = useState<NewsJuryMember[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const load = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const result = await getJuryMembers(juryId)
      setMembers(result)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load jury members'))
    } finally {
      setIsLoading(false)
    }
  }, [juryId])

  useEffect(() => { load() }, [load])

  return { members, isLoading, error, refetch: load }
}

export function useReputations() {
  const [reputations, setReputations] = useState<NewsReputation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const load = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const result = await getReputations()
      setReputations(result)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load reputations'))
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  return { reputations, isLoading, error, refetch: load }
}

export function useVoteStats(juryId: string) {
  const { members, isLoading, error } = useJuryMembers(juryId)

  const stats = {
    total: members.length,
    voted: members.filter(m => m.status === 'voted').length,
    agree: members.filter(m => m.vote === 'agree').length,
    disagree: members.filter(m => m.vote === 'disagree').length,
    abstain: members.filter(m => m.vote === 'abstain').length,
    pending: members.filter(m => m.status !== 'voted').length,
    consensusReached: members.filter(m => m.vote === 'agree').length / members.length >= 0.6,
  }

  return { stats, members, isLoading, error }
}
