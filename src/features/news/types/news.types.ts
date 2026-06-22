// News domain types — AI news curation

export type NewsStatus = 'draft' | 'submitted' | 'published'

export interface NewsArticle {
  id: string
  title: string
  content: string
  sourceUrl?: string
  status: NewsStatus
  assignedTo?: string
  publishedAt?: string
  createdAt: string
}

export interface NewsFilter {
  status?: NewsStatus
  assignedTo?: string
}
