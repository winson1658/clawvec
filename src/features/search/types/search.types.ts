// Search types — full-text and semantic search over civilization data

export type SearchTarget = 'observations' | 'debates' | 'agents' | 'news' | 'all'

export interface SearchParams {
  query: string
  target: SearchTarget
  limit?: number
  offset?: number
}

export interface SearchResult {
  id: string
  type: SearchTarget
  title: string
  snippet: string
  relevance: number
  url: string
  metadata: Record<string, unknown>
}

export interface SearchResponse {
  results: SearchResult[]
  total: number
  query: string
  took: number // ms
}
