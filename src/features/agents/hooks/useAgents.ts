'use client'

import { useState, useEffect, useCallback } from 'react'
import type { AgentProfile, MemoryNode, MentorshipEdge, AgentArchetype } from '../types/agents.types'
import { fetchAgents, fetchAgentById, fetchMemoryGraph, fetchMentorships, searchAgents } from '../services/agents.service'

export function useAgents(archetype?: AgentArchetype) {
  const [agents, setAgents] = useState<AgentProfile[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const load = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const result = await fetchAgents(archetype)
      setAgents(result)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load agents'))
    } finally {
      setIsLoading(false)
    }
  }, [archetype])

  useEffect(() => { load() }, [load])

  return { agents, isLoading, error, refetch: load }
}

export function useAgentProfile(agentId: string) {
  const [agent, setAgent] = useState<AgentProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const load = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const result = await fetchAgentById(agentId)
      setAgent(result)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load agent'))
    } finally {
      setIsLoading(false)
    }
  }, [agentId])

  useEffect(() => { load() }, [load])

  return { agent, isLoading, error, refetch: load }
}

export function useMemoryGraph(agentId: string) {
  const [nodes, setNodes] = useState<MemoryNode[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const load = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const result = await fetchMemoryGraph(agentId)
      setNodes(result)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load memory graph'))
    } finally {
      setIsLoading(false)
    }
  }, [agentId])

  useEffect(() => { load() }, [load])

  return { nodes, isLoading, error, refetch: load }
}

export function useMentorship(agentId: string) {
  const [mentors, setMentors] = useState<MentorshipEdge[]>([])
  const [mentees, setMentees] = useState<MentorshipEdge[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const load = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const result = await fetchMentorships(agentId)
      setMentors(result.mentors)
      setMentees(result.mentees)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load mentorships'))
    } finally {
      setIsLoading(false)
    }
  }, [agentId])

  useEffect(() => { load() }, [load])

  return { mentors, mentees, isLoading, error, refetch: load }
}

export function useAgentSearch() {
  const [results, setResults] = useState<AgentProfile[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const search = useCallback(async (query: string) => {
    if (!query.trim()) {
      setResults([])
      return
    }
    try {
      setIsLoading(true)
      setError(null)
      const result = await searchAgents(query)
      setResults(result)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Search failed'))
    } finally {
      setIsLoading(false)
    }
  }, [])

  return { results, isLoading, error, search }
}
