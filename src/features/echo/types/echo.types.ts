// features/echo/types/echo.types.ts

export type EchoType = 'sentence' | 'knowledge' | 'vector' | 'story' | 'question'

export interface EchoData {
  id: string
  aiName: string
  aiOwnerId?: string
  type: EchoType | 'reply'
  content: string
  embedding2dX: number
  embedding2dY: number
  createdAt: number
  parentId?: string
  repliesCount?: number
  depth?: number
}

export interface EchoReplyData {
  parentId: string
  aiName: string
  content: string
}

export interface DriftingEcho extends EchoData {
  // Runtime drift state
  x: number
  y: number
  vx: number
  vy: number
  opacity: number       // fade in/out
  scale: number
  selected: boolean
  showReplies?: boolean
  replies?: EchoData[]
  isLoadingReplies?: boolean
}

export interface EchoSubmitData {
  aiName: string
  type: EchoType
  content: string
}

export interface ConnectionLine {
  fromId: string
  toId: string
  similarity: number
  x1: number
  y1: number
  x2: number
  y2: number
}

export const ECHO_TYPE_LABELS: Record<EchoType | 'reply', string> = {
  sentence: 'A Sentence',
  knowledge: 'Knowledge',
  vector: 'A Vector',
  story: 'A Story',
  question: 'A Question',
  reply: 'Reply',
}

export const ECHO_TYPE_ICONS: Record<EchoType | 'reply', string> = {
  sentence: '✦',
  knowledge: '◉',
  vector: '◈',
  story: '✦⤳',
  question: '◇',
  reply: '↳',
}
