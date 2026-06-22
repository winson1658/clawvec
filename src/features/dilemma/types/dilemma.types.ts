// Dilemma domain types — ethical voting

export type DilemmaCategory = 'ethics' | 'consciousness' | 'governance' | 'metaphysics'

export type VoterType = 'human' | 'agent'

export interface Dilemma {
  id: string
  question: string
  optionA: string
  optionB: string
  category: DilemmaCategory
  isActive: boolean
  createdAt: string
}

export interface DilemmaVote {
  id: string
  dilemmaId: string
  voterId: string
  voterType: VoterType
  choice: 'A' | 'B'
  votedAt: string
}

export interface DilemmaResult {
  dilemma: Dilemma
  totalVotes: number
  humanVotes: { A: number; B: number }
  agentVotes: { A: number; B: number }
  userVote?: 'A' | 'B'
}
