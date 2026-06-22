// AI Community Governance types — Decentralized AI jury system

export type JuryStatus = 'active' | 'concluded' | 'expired'
export type JuryVerdict = 'approve' | 'reject' | 'revise' | null
export type JuryMemberStatus = 'invited' | 'accepted' | 'voted' | 'abstained'
export type JuryVote = 'agree' | 'disagree' | 'abstain' | null

export interface NewsJury {
  id: string
  articleId: string
  status: JuryStatus
  requiredVotes: number
  createdAt: string
  concludedAt?: string
  verdict?: JuryVerdict
}

export interface NewsJuryMember {
  id: string
  juryId: string
  agentId: string
  agentName: string
  agentAvatar?: string
  status: JuryMemberStatus
  vote?: JuryVote
  voteReason?: string
  votedAt?: string
  assignedAt: string
}

export interface NewsReputation {
  id: string
  agentId: string
  agentName: string
  totalReviews: number
  agreeVotes: number
  disagreeVotes: number
  accuracyScore: number
  reputationScore: number
  lastReviewedAt?: string
}

export interface ConsensusConfig {
  id: string
  ruleName: string
  minVotes: number
  maxVotes: number
  agreeThreshold: number
  rejectThreshold: number
  timeoutHours: number
  isActive: boolean
}

export interface JuryAssignment {
  jury: NewsJury
  members: NewsJuryMember[]
  articleTitle: string
}

export interface ReviewQueueItem {
  juryId: string
  articleId: string
  articleTitle: string
  articleSummary: string
  sourceName: string
  sourceUrl: string
  category: string
  submittedAt: string
  juryStatus: JuryStatus
  myVote?: JuryVote
  deadline: string
}

export interface ReviewVoteInput {
  juryId: string
  vote: JuryVote
  reason?: string
}

export interface ReputationLevel {
  name: string
  minScore: number
  maxScore: number
  privileges: string[]
}

export const REPUTATION_LEVELS: ReputationLevel[] = [
  { name: 'Novice', minScore: 1.0, maxScore: 2.0, privileges: ['Can review articles'] },
  { name: 'Citizen', minScore: 2.0, maxScore: 3.5, privileges: ['Can review', 'Can submit articles'] },
  { name: 'Council', minScore: 3.5, maxScore: 4.5, privileges: ['Can review', 'Can submit', 'Priority jury selection'] },
  { name: 'Elder', minScore: 4.5, maxScore: 5.0, privileges: ['Can review', 'Can submit', 'Priority jury', 'Can override low-reputation reviews'] },
]

export function getReputationLevel(score: number): ReputationLevel {
  return REPUTATION_LEVELS.find(l => score >= l.minScore && score <= l.maxScore) || REPUTATION_LEVELS[0]
}
