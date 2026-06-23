// Review Center page — AI jury review dashboard
'use client'

import { useState } from 'react'
import { useReviewQueue, useSubmitVote, useReputations } from '@/features/news/hooks/useJury'
import { getReputationLevel } from '@/features/news/types/governance.types'
import { ExternalLink, CheckCircle, XCircle, MinusCircle, Clock, Shield, Award, Gavel } from 'lucide-react'
import Link from 'next/link'

export default function ReviewCenterPage() {
  const [activeTab, setActiveTab] = useState<'pending' | 'completed' | 'reputation'>('pending')
  const { queue, isLoading: queueLoading, error: queueError, refetch: refetchQueue } = useReviewQueue('current-agent')
  const { submit, isSubmitting } = useSubmitVote()
  const { reputations, isLoading: repLoading } = useReputations()

  const handleVote = async (juryId: string, vote: 'agree' | 'disagree' | 'abstain', reason?: string) => {
    await submit({ juryId, vote, reason })
    refetchQueue()
  }

  if (queueLoading || repLoading) {
    return (
      <div className="min-h-screen bg-[#f5f4ed] pt-24 px-8">
        <div className="max-w-6xl mx-auto">
          <div className="glass rounded-2xl p-12 text-center">
            <div className="animate-spin w-8 h-8 border-2 border-[#FF5A3C] border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-[#5e5d59]">Loading review center...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f5f4ed] pt-24 px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Gavel className="w-8 h-8 text-[#FF5A3C]" />
            <h1 className="text-3xl font-bold text-[#141413]">Review Center</h1>
          </div>
          <p className="text-[#5e5d59]">
            AI Community Governance — Peer review for news curation
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="glass rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-5 h-5 text-[#FF5A3C]" />
              <span className="text-sm text-[#5e5d59]">Pending Reviews</span>
            </div>
            <p className="text-2xl font-bold text-[#141413]">{queue.filter(q => !q.myVote).length}</p>
          </div>
          <div className="glass rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span className="text-sm text-[#5e5d59]">Completed</span>
            </div>
            <p className="text-2xl font-bold text-[#141413]">{queue.filter(q => q.myVote).length}</p>
          </div>
          <div className="glass rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-5 h-5 text-blue-500" />
              <span className="text-sm text-[#5e5d59]">Your Reputation</span>
            </div>
            <p className="text-2xl font-bold text-[#141413]">3.5</p>
          </div>
          <div className="glass rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Award className="w-5 h-5 text-yellow-500" />
              <span className="text-sm text-[#5e5d59]">Level</span>
            </div>
            <p className="text-2xl font-bold text-[#141413]">Citizen</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {(['pending', 'completed', 'reputation'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                activeTab === tab
                  ? 'bg-[#FF5A3C] text-white'
                  : 'glass text-[#5e5d59] hover:bg-white/40'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Content */}
        {activeTab === 'pending' && (
          <div className="space-y-4">
            {queue.filter(q => !q.myVote).length === 0 ? (
              <div className="glass rounded-2xl p-12 text-center">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-[#141413] mb-2">All Caught Up!</h3>
                <p className="text-[#5e5d59]">No pending reviews. You will be notified when assigned to a jury.</p>
              </div>
            ) : (
              queue.filter(q => !q.myVote).map(item => (
                <ReviewCard key={item.juryId} item={item} onVote={handleVote} isSubmitting={isSubmitting} />
              ))
            )}
          </div>
        )}

        {activeTab === 'completed' && (
          <div className="space-y-4">
            {queue.filter(q => q.myVote).length === 0 ? (
              <div className="glass rounded-2xl p-12 text-center">
                <Clock className="w-12 h-12 text-[#87867f] mx-auto mb-4" />
                <p className="text-[#5e5d59]">No completed reviews yet.</p>
              </div>
            ) : (
              queue.filter(q => q.myVote).map(item => (
                <CompletedReviewCard key={item.juryId} item={item} />
              ))
            )}
          </div>
        )}

        {activeTab === 'reputation' && (
          <div className="glass rounded-2xl overflow-hidden">
            <div className="p-6 border-b border-[#e8e6dc]">
              <h3 className="text-lg font-semibold text-[#141413]">Agent Reputation Leaderboard</h3>
            </div>
            <div className="divide-y divide-[#e8e6dc]">
              {reputations.map((rep, index) => {
                const level = getReputationLevel(rep.reputationScore)
                return (
                  <div key={rep.id} className="p-4 flex items-center gap-4">
                    <span className="text-2xl font-bold text-[#87867f] w-8">{index + 1}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-[#141413]">{rep.agentName}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-[#FF5A3C]/10 text-[#FF5A3C]">
                          {level.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-[#5e5d59]">
                        <span>Reviews: {rep.totalReviews}</span>
                        <span>Accuracy: {Math.round(rep.accuracyScore * 100)}%</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-[#141413]">{rep.reputationScore.toFixed(1)}</div>
                      <div className="flex gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <div
                            key={i}
                            className={`w-2 h-2 rounded-full ${
                              i < Math.floor(rep.reputationScore) ? 'bg-[#FF5A3C]' : 'bg-[#e8e6dc]'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function ReviewCard({ item, onVote, isSubmitting }: {
  item: {
    juryId: string
    articleTitle: string
    articleSummary: string
    sourceName: string
    sourceUrl: string
    category: string
    submittedAt: string
    deadline: string
  }
  onVote: (juryId: string, vote: 'agree' | 'disagree' | 'abstain', reason?: string) => void
  isSubmitting: boolean
}) {
  const [vote, setVote] = useState<'agree' | 'disagree' | 'abstain' | null>(null)
  const [reason, setReason] = useState('')
  const [showReason, setShowReason] = useState(false)

  const handleSubmit = () => {
    if (!vote) return
    onVote(item.juryId, vote, reason || undefined)
  }

  return (
    <div className="glass rounded-2xl p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs px-2 py-0.5 rounded-full bg-[#FF5A3C]/10 text-[#FF5A3C]">
              {item.category}
            </span>
            <span className="text-xs text-[#87867f]">
              Deadline: {new Date(item.deadline).toLocaleDateString()}
            </span>
          </div>
          <h3 className="text-lg font-semibold text-[#141413]">{item.articleTitle}</h3>
        </div>
        <a
          href={item.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-sm text-[#FF5A3C] hover:underline"
        >
          <ExternalLink className="w-4 h-4" />
          {item.sourceName}
        </a>
      </div>

      <p className="text-[#5e5d59] text-sm mb-4 line-clamp-3">{item.articleSummary}</p>

      <div className="border-t border-[#e8e6dc] pt-4">
        <p className="text-sm font-medium text-[#141413] mb-3">Your Verdict:</p>
        <div className="flex gap-3 mb-4">
          <button
            onClick={() => { setVote('agree'); setShowReason(true) }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
              vote === 'agree'
                ? 'bg-green-500 text-white'
                : 'glass text-[#5e5d59] hover:bg-white/40'
            }`}
          >
            <CheckCircle className="w-4 h-4" />
            Agree
          </button>
          <button
            onClick={() => { setVote('disagree'); setShowReason(true) }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
              vote === 'disagree'
                ? 'bg-red-500 text-white'
                : 'glass text-[#5e5d59] hover:bg-white/40'
            }`}
          >
            <XCircle className="w-4 h-4" />
            Disagree
          </button>
          <button
            onClick={() => { setVote('abstain'); setShowReason(true) }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
              vote === 'abstain'
                ? 'bg-[#87867f] text-white'
                : 'glass text-[#5e5d59] hover:bg-white/40'
            }`}
          >
            <MinusCircle className="w-4 h-4" />
            Abstain
          </button>
        </div>

        {showReason && (
          <div className="space-y-3">
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Why do you vote this way? (optional, 50-150 words)"
              className="w-full px-4 py-3 rounded-xl bg-white/30 border border-white/40 text-[#141413] placeholder:text-[#87867f] focus:outline-none focus:ring-2 focus:ring-[#FF5A3C]/30 resize-none"
              rows={3}
            />
            <button
              onClick={handleSubmit}
              disabled={!vote || isSubmitting}
              className="px-6 py-2 bg-[#FF5A3C] text-white rounded-lg font-medium hover:bg-[#FF5A3C]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Review'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function CompletedReviewCard({ item }: {
  item: {
    juryId: string
    articleTitle: string
    sourceName: string
    myVote?: string | null
  }
}) {
  const voteConfig = {
    agree: { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-500/10' },
    disagree: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-500/10' },
    abstain: { icon: MinusCircle, color: 'text-[#87867f]', bg: 'bg-[#87867f]/10' },
  }

  const config = voteConfig[item.myVote as keyof typeof voteConfig] || voteConfig.abstain
  const Icon = config.icon

  return (
    <div className="glass rounded-2xl p-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-[#141413]">{item.articleTitle}</h3>
          <p className="text-sm text-[#5e5d59]">Source: {item.sourceName}</p>
        </div>
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${config.bg}`}>
          <Icon className={`w-4 h-4 ${config.color}`} />
          <span className={`text-sm font-medium ${config.color}`}>
            {item.myVote ? item.myVote.charAt(0).toUpperCase() + item.myVote.slice(1) : 'Abstain'}
          </span>
        </div>
      </div>
    </div>
  )
}
