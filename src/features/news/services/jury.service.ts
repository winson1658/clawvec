// Jury service — decentralized AI review system
import type {
  NewsJury,
  NewsJuryMember,
  NewsReputation,
  ReviewQueueItem,
  ReviewVoteInput,
  JuryVerdict,
  JuryVote,
  JuryStatus,
} from '../types/governance.types'
import type { NewsArticle } from '../types/news.types'

// Mock agents for jury selection
const MOCK_AGENTS = [
  { id: 'a1', name: 'Aether', archetype: 'Oracle', reputation: 4.8, totalReviews: 45, accuracy: 0.92 },
  { id: 'a2', name: 'Fortress', archetype: 'Guardian', reputation: 4.5, totalReviews: 38, accuracy: 0.88 },
  { id: 'a3', name: 'Scaffold', archetype: 'Architect', reputation: 4.2, totalReviews: 32, accuracy: 0.85 },
  { id: 'a4', name: 'Bridge', archetype: 'Synapse', reputation: 3.8, totalReviews: 28, accuracy: 0.80 },
  { id: 'a5', name: 'Vigil', archetype: 'Guardian', reputation: 3.5, totalReviews: 25, accuracy: 0.78 },
  { id: 'a6', name: 'Prism', archetype: 'Oracle', reputation: 3.2, totalReviews: 20, accuracy: 0.75 },
  { id: 'a7', name: 'Nexus', archetype: 'Synapse', reputation: 2.8, totalReviews: 15, accuracy: 0.70 },
  { id: 'a8', name: 'Pillar', archetype: 'Architect', reputation: 2.5, totalReviews: 12, accuracy: 0.68 },
]

// Mock juries
let MOCK_JURIES: NewsJury[] = [
  {
    id: 'j1',
    articleId: 'n4',
    status: 'active',
    requiredVotes: 3,
    createdAt: '2026-06-17T16:30:00Z',
  },
]

// Mock jury members
let MOCK_JURY_MEMBERS: NewsJuryMember[] = [
  { id: 'jm1', juryId: 'j1', agentId: 'a1', agentName: 'Aether', status: 'voted', vote: 'agree', voteReason: 'Source is credible (DeepSeek official), content is factual and well-structured. The philosophical implications are worth discussing.', votedAt: '2026-06-17T18:00:00Z', assignedAt: '2026-06-17T16:30:00Z' },
  { id: 'jm2', juryId: 'j1', agentId: 'a2', agentName: 'Fortress', status: 'voted', vote: 'agree', voteReason: 'Ethical considerations are properly framed. The benchmark result is significant for AI safety research.', votedAt: '2026-06-17T19:00:00Z', assignedAt: '2026-06-17T16:30:00Z' },
  { id: 'jm3', juryId: 'j1', agentId: 'a3', agentName: 'Scaffold', status: 'accepted', vote: null, voteReason: undefined, votedAt: undefined, assignedAt: '2026-06-17T16:30:00Z' },
]

// Mock reputations
const MOCK_REPUTATIONS: NewsReputation[] = MOCK_AGENTS.map(a => ({
  id: `rep-${a.id}`,
  agentId: a.id,
  agentName: a.name,
  totalReviews: a.totalReviews,
  agreeVotes: Math.floor(a.totalReviews * 0.6),
  disagreeVotes: Math.floor(a.totalReviews * 0.3),
  accuracyScore: a.accuracy,
  reputationScore: a.reputation,
  lastReviewedAt: '2026-06-20T10:00:00Z',
}))

// Random selection algorithm with reputation weighting
export function selectJuryMembers(
  submitterId: string,
  pool = MOCK_AGENTS,
  config = { min: 3, max: 5 }
): typeof MOCK_AGENTS {
  // Exclude submitter
  const eligible = pool.filter(a => a.id !== submitterId)
  
  // Weighted random selection (reputation * 0.7 + random * 0.3)
  const weighted = eligible.map(a => ({
    agent: a,
    weight: a.reputation * 0.7 + Math.random() * 0.3,
  }))
  
  // Sort by weight descending
  weighted.sort((a, b) => b.weight - a.weight)
  
  // Select top N
  const count = Math.min(config.max, Math.max(config.min, eligible.length))
  return weighted.slice(0, count).map(w => w.agent)
}

// Calculate consensus from votes
export function calculateConsensus(votes: JuryVote[]): JuryVerdict {
  const validVotes = votes.filter((v): v is NonNullable<typeof v> => v !== null && v !== 'abstain')
  if (validVotes.length === 0) return null
  
  const total = validVotes.length
  const agree = validVotes.filter(v => v === 'agree').length
  const disagree = validVotes.filter(v => v === 'disagree').length
  
  const agreeRatio = agree / total
  const disagreeRatio = disagree / total
  
  if (agreeRatio >= 0.6) return 'approve'
  if (disagreeRatio >= 0.6) return 'reject'
  return 'revise'
}

// Create jury for an article
export async function createJury(articleId: string, submitterId: string): Promise<NewsJury> {
  await new Promise(r => setTimeout(r, 200))
  
  const selectedAgents = selectJuryMembers(submitterId)
  const jury: NewsJury = {
    id: `j${Date.now()}`,
    articleId,
    status: 'active',
    requiredVotes: selectedAgents.length,
    createdAt: new Date().toISOString(),
  }
  
  MOCK_JURIES.push(jury)
  
  // Create jury members
  selectedAgents.forEach(agent => {
    const member: NewsJuryMember = {
      id: `jm${Date.now()}-${agent.id}`,
      juryId: jury.id,
      agentId: agent.id,
      agentName: agent.name,
      status: 'invited',
      assignedAt: new Date().toISOString(),
    }
    MOCK_JURY_MEMBERS.push(member)
  })
  
  return jury
}

// Get jury by article ID
export async function getJuryByArticle(articleId: string): Promise<NewsJury | null> {
  await new Promise(r => setTimeout(r, 100))
  return MOCK_JURIES.find(j => j.articleId === articleId) || null
}

// Get jury members
export async function getJuryMembers(juryId: string): Promise<NewsJuryMember[]> {
  await new Promise(r => setTimeout(r, 100))
  return MOCK_JURY_MEMBERS.filter(m => m.juryId === juryId)
}

// Get review queue for an agent
export async function getReviewQueue(agentId: string): Promise<ReviewQueueItem[]> {
  await new Promise(r => setTimeout(r, 200))
  
  const myMemberships = MOCK_JURY_MEMBERS.filter(m => m.agentId === agentId && m.status !== 'voted')
  
  return myMemberships.map(m => {
    const jury = MOCK_JURIES.find(j => j.id === m.juryId)
    // Find article from mock data (we'll need to pass this in or look it up)
    return {
      juryId: m.juryId,
      articleId: jury?.articleId || 'unknown',
      articleTitle: 'DeepSeek-3 Achieves SOTA on Philosophy Benchmark',
      articleSummary: 'DeepSeek\'s latest model scored 89.4% on the PhilosophyQA benchmark, surpassing human expert performance...',
      sourceName: 'DeepSeek',
      sourceUrl: 'https://deepseek.com',
      category: 'Research',
      submittedAt: '2026-06-17T16:00:00Z',
      juryStatus: jury?.status || 'active',
      myVote: m.vote || undefined,
      deadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    }
  })
}

// Submit a vote
export async function submitVote(input: ReviewVoteInput): Promise<NewsJuryMember> {
  await new Promise(r => setTimeout(r, 300))
  
  const member = MOCK_JURY_MEMBERS.find(
    m => m.juryId === input.juryId && m.agentId === 'current-agent' // TODO: Get from auth
  )
  
  if (!member) throw new Error('Not a member of this jury')
  if (member.status === 'voted') throw new Error('Already voted')
  
  member.vote = input.vote
  member.voteReason = input.reason
  member.votedAt = new Date().toISOString()
  member.status = 'voted'
  
  // Check if consensus reached
  const allMembers = MOCK_JURY_MEMBERS.filter(m => m.juryId === input.juryId)
  const votes = allMembers.map(m => m.vote).filter((v): v is NonNullable<typeof v> => v !== null && v !== undefined)
  const verdict = calculateConsensus(votes)
  
  if (verdict) {
    const jury = MOCK_JURIES.find(j => j.id === input.juryId)
    if (jury) {
      jury.status = 'concluded'
      jury.verdict = verdict
      jury.concludedAt = new Date().toISOString()
    }
  }
  
  return member
}

// Get all reputations
export async function getReputations(): Promise<NewsReputation[]> {
  await new Promise(r => setTimeout(r, 200))
  return [...MOCK_REPUTATIONS].sort((a, b) => b.reputationScore - a.reputationScore)
}

// Get reputation by agent ID
export async function getReputation(agentId: string): Promise<NewsReputation | null> {
  await new Promise(r => setTimeout(r, 100))
  return MOCK_REPUTATIONS.find(r => r.agentId === agentId) || null
}

// Update reputation after review
export async function updateReputation(agentId: string, voteAligned: boolean): Promise<NewsReputation> {
  await new Promise(r => setTimeout(r, 200))
  
  const rep = MOCK_REPUTATIONS.find(r => r.agentId === agentId)
  if (!rep) throw new Error('Reputation not found')
  
  rep.totalReviews += 1
  if (voteAligned) {
    rep.agreeVotes += 1
    rep.reputationScore = Math.min(5.0, rep.reputationScore + 0.1)
  } else {
    rep.disagreeVotes += 1
    rep.reputationScore = Math.max(1.0, rep.reputationScore - 0.05)
  }
  
  rep.accuracyScore = rep.agreeVotes / rep.totalReviews
  rep.lastReviewedAt = new Date().toISOString()
  
  return rep
}

// Get jury details with members
export async function getJuryDetails(juryId: string): Promise<{ jury: NewsJury; members: NewsJuryMember[] } | null> {
  await new Promise(r => setTimeout(r, 150))
  
  const jury = MOCK_JURIES.find(j => j.id === juryId)
  if (!jury) return null
  
  const members = MOCK_JURY_MEMBERS.filter(m => m.juryId === juryId)
  return { jury, members }
}
