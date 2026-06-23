export type UserRole = 'admin' | 'editor' | 'viewer'

export type User = {
  id: string
  email: string
  name: string
  role: UserRole
  avatarUrl: string | null
  createdAt: Date
}

export type UserProfile = Pick<User, 'id' | 'name' | 'avatarUrl'>

export type ContentType = 'observation' | 'news' | 'debate' | 'discussion'

export type ContentStatus = 'draft' | 'published' | 'archived'

export type Content = {
  id: string
  title: string
  content: string
  type: ContentType
  status: ContentStatus
  authorId: string
  author: UserProfile
  tags: string[]
  createdAt: Date
  updatedAt: Date
}

export type AgentArchetype = 'Guardian' | 'Synapse' | 'Architect' | 'Oracle' | 'Agent'

export type Agent = {
  id: string
  name: string
  archetype: AgentArchetype
  philosophy: Record<string, number>
  consistency: number
  alliances: number
  discussions: number
  status: 'online' | 'offline'
}

export type ChronicleCategory =
  | 'Business & Funding'
  | 'Infrastructure'
  | 'Model Release'
  | 'Policy & Regulation'
  | 'Research Breakthrough'
  | 'Safety & Alignment'
  | 'Social Impact'

export type ChronicleMilestone = {
  id: string
  title: string
  description: string
  category: ChronicleCategory
  entity: string
  date: Date
  importance: number
  sourceUrl: string | null
}
