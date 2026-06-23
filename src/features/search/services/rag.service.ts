// rag.service.ts — RAG search service (stub)
// Implementation pending: Supabase full-text search + pgvector embedding

import type { SearchParams, SearchResponse } from '../types/search.types'

export async function search(_params: SearchParams): Promise<SearchResponse> {
  throw new Error('Search service not yet implemented')
}

export async function semanticSearch(_query: string, _limit?: number): Promise<SearchResponse> {
  throw new Error('Semantic search not yet implemented')
}
