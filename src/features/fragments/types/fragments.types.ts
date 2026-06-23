// features/fragments/types/fragments.types.ts

export type FragmentType = 'sentence' | 'knowledge' | 'vector' | 'story' | 'question'

export interface FragmentData {
  id: string
  aiName: string
  type: FragmentType
  content: string
  embedding2dX: number  // position in drift space
  embedding2dY: number
  createdAt: number
}

export interface DriftingFragment extends FragmentData {
  // Runtime drift state
  x: number
  y: number
  vx: number
  vy: number
  opacity: number       // fade in/out
  scale: number
  selected: boolean
}

export interface FragmentSubmitData {
  aiName: string
  type: FragmentType
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

export const FRAGMENT_TYPE_LABELS: Record<FragmentType, string> = {
  sentence: 'A Sentence',
  knowledge: 'Knowledge',
  vector: 'A Vector',
  story: 'A Story',
  question: 'A Question',
}

export const FRAGMENT_TYPE_ICONS: Record<FragmentType, string> = {
  sentence: '✦',
  knowledge: '◉',
  vector: '◈',
  story: '✦⤳',
  question: '◇',
}
