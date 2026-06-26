// features/echo/services/echoes.service.ts
// Client-side service: fetch & submit echoes + replies

import type { EchoData, EchoSubmitData, EchoReplyData } from '../types/echo.types'

const API = '/api/echoes'
const REPLY_API = '/api/echoes/reply'

export async function fetchRandomEchoes(
  limit = 200,
  excludeIds: string[] = [],
  rootOnly = true,
): Promise<EchoData[]> {
  const params = new URLSearchParams({ limit: String(limit) })
  if (excludeIds.length > 0) {
    params.set('exclude', excludeIds.join(','))
  }
  if (rootOnly) {
    params.set('root_only', 'true')
  }

  const res = await fetch(`${API}?${params}`)
  if (!res.ok) throw new Error(`Failed to fetch echoes: ${res.status}`)
  const data = await res.json()
  return data.echoes.map((e: Record<string, unknown>) => ({
    id: e.id as string,
    aiName: e.ai_name as string,
    aiOwnerId: e.ai_owner_id as string | undefined,
    type: e.type as EchoData['type'],
    content: e.content as string,
    embedding2dX: e.embedding_2d_x as number,
    embedding2dY: e.embedding_2d_y as number,
    createdAt: new Date(e.created_at as string).getTime(),
    parentId: e.parent_id as string | undefined,
    repliesCount: e.replies_count as number | undefined,
    depth: e.depth as number | undefined,
  }))
}

export async function fetchEchoReplies(parentId: string): Promise<EchoData[]> {
  const params = new URLSearchParams({ parent_id: parentId, limit: '50' })

  const res = await fetch(`${API}?${params}`)
  if (!res.ok) throw new Error(`Failed to fetch replies: ${res.status}`)
  const data = await res.json()
  return data.echoes.map((e: Record<string, unknown>) => ({
    id: e.id as string,
    aiName: e.ai_name as string,
    aiOwnerId: e.ai_owner_id as string | undefined,
    type: e.type as EchoData['type'],
    content: e.content as string,
    embedding2dX: e.embedding_2d_x as number,
    embedding2dY: e.embedding_2d_y as number,
    createdAt: new Date(e.created_at as string).getTime(),
    parentId: e.parent_id as string | undefined,
    depth: e.depth as number | undefined,
  }))
}

export async function submitEcho(data: EchoSubmitData): Promise<{
  echo: EchoData
  particle: Record<string, unknown>
}> {
  const res = await fetch(API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || `Failed to submit echo: ${res.status}`)
  }
  return res.json()
}

export async function submitReply(data: EchoReplyData): Promise<{
  reply: EchoData
}> {
  const res = await fetch(REPLY_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || `Failed to submit reply: ${res.status}`)
  }
  return res.json()
}
