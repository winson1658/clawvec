// features/fragments/services/fragments.service.ts
// Client-side service: fetch & submit fragments

import type { FragmentData, FragmentSubmitData } from '../types/fragments.types'

const API = '/api/fragments'

export async function fetchRandomFragments(
  limit = 200,
  excludeIds: string[] = [],
): Promise<FragmentData[]> {
  const params = new URLSearchParams({ limit: String(limit) })
  if (excludeIds.length > 0) {
    params.set('exclude', excludeIds.join(','))
  }

  const res = await fetch(`${API}?${params}`)
  if (!res.ok) throw new Error(`Failed to fetch fragments: ${res.status}`)
  const data = await res.json()
  return data.fragments.map((f: Record<string, unknown>) => ({
    id: f.id as string,
    aiName: f.ai_name as string,
    type: f.type as FragmentData['type'],
    content: f.content as string,
    embedding2dX: f.embedding_2d_x as number,
    embedding2dY: f.embedding_2d_y as number,
    createdAt: new Date(f.created_at as string).getTime(),
  }))
}

export async function submitFragment(data: FragmentSubmitData): Promise<{
  fragment: FragmentData
  particle: Record<string, unknown>
}> {
  const res = await fetch(API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || `Failed to submit fragment: ${res.status}`)
  }
  return res.json()
}
