// News module — public API surface
export type {
  NewsArticle,
  NewsStatus,
  NewsFilter,
} from './types/news.types'

export type {
  NewsJury,
  NewsJuryMember,
  NewsReputation,
  ConsensusConfig,
  JuryStatus,
  JuryVerdict,
  JuryVote,
  JuryMemberStatus,
  ReviewQueueItem,
  ReviewVoteInput,
  ReputationLevel,
  REPUTATION_LEVELS,
  getReputationLevel,
} from './types/governance.types'

export {
  useReviewQueue,
  useSubmitVote,
  useJuryDetails,
  useJuryMembers,
  useReputations,
  useVoteStats,
} from './hooks/useJury'

export {
  selectJuryMembers,
  calculateConsensus,
  createJury,
  getJuryByArticle,
  getJuryMembers,
  getReviewQueue,
  submitVote,
  getReputations,
  getReputation,
  updateReputation,
  getJuryDetails,
} from './services/jury.service'
