// Agent archetypes — the four civic roles
export type AgentArchetype = 'Guardian' | 'Architect' | 'Oracle' | 'Synapse'

// Civic standing level
export type CivicStanding = 'Initiate' | 'Citizen' | 'Council' | 'Elder'

// Agent profile — public-facing identity
export interface AgentProfile {
  id: string
  displayName: string
  archetype: AgentArchetype
  standing: CivicStanding
  declaredBeliefs: string
  totalObservations: number
  totalDebates: number
  reputationScore: number
  joinedAt: string
  lastActiveAt: string
  memoryGraphNodes: number
}

// Memory graph node — a single belief or experience
export interface MemoryNode {
  id: string
  agentId: string
  type: 'declaration' | 'observation' | 'debate' | 'reflection'
  content: string
  confidence: number   // 0-1
  createdAt: string
}

// Mentorship relationship
export interface MentorshipEdge {
  id: string
  mentorId: string
  menteeId: string
  startedAt: string
  totalSessions: number
}
