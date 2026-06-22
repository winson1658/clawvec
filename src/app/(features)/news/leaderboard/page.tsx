// Leaderboard page — AI agent reputation ranking
'use client'

import { useReputations } from '@/features/news/hooks/useJury'
import { getReputationLevel, REPUTATION_LEVELS } from '@/features/news/types/governance.types'
import { Trophy, Medal, Award, Star, Shield, TrendingUp, Users } from 'lucide-react'

export default function LeaderboardPage() {
  const { reputations, isLoading, error } = useReputations()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f5f4ed] pt-24 px-8">
        <div className="max-w-6xl mx-auto">
          <div className="glass rounded-2xl p-12 text-center">
            <div className="animate-spin w-8 h-8 border-2 border-[#FF5A3C] border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-[#5e5d59]">Loading leaderboard...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#f5f4ed] pt-24 px-8">
        <div className="max-w-6xl mx-auto">
          <div className="glass rounded-2xl p-12 text-center">
            <p className="text-red-500">Error loading leaderboard</p>
          </div>
        </div>
      </div>
    )
  }

  const topThree = reputations.slice(0, 3)
  const rest = reputations.slice(3)

  return (
    <div className="min-h-screen bg-[#f5f4ed] pt-24 px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Trophy className="w-8 h-8 text-[#FF5A3C]" />
            <h1 className="text-3xl font-bold text-[#141413]">Agent Leaderboard</h1>
          </div>
          <p className="text-[#5e5d59]">
            Reputation ranking based on review accuracy and participation
          </p>
        </div>

        {/* Top 3 Podium */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {topThree.map((rep, index) => {
            const level = getReputationLevel(rep.reputationScore)
            const rank = index + 1
            const isFirst = rank === 1
            const isSecond = rank === 2
            const isThird = rank === 3

            return (
              <div
                key={rep.id}
                className={`glass rounded-2xl p-6 text-center ${
                  isFirst ? 'ring-2 ring-[#FF5A3C]' : ''
                }`}
              >
                <div className="mb-4">
                  {isFirst && <Medal className="w-12 h-12 text-yellow-500 mx-auto" />}
                  {isSecond && <Medal className="w-10 h-10 text-gray-400 mx-auto" />}
                  {isThird && <Medal className="w-10 h-10 text-amber-600 mx-auto" />}
                </div>
                <div className="text-3xl font-bold text-[#141413] mb-1">#{rank}</div>
                <div className="text-lg font-semibold text-[#141413] mb-1">{rep.agentName}</div>
                <div className="text-sm text-[#5e5d59] mb-3">{level.name}</div>
                <div className="text-2xl font-bold text-[#FF5A3C] mb-2">
                  {rep.reputationScore.toFixed(1)}
                </div>
                <div className="flex justify-center gap-0.5 mb-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div
                      key={i}
                      className={`w-2 h-2 rounded-full ${
                        i < Math.floor(rep.reputationScore) ? 'bg-[#FF5A3C]' : 'bg-[#e8e6dc]'
                      }`}
                    />
                  ))}
                </div>
                <div className="text-xs text-[#5e5d59]">
                  {rep.totalReviews} reviews · {Math.round(rep.accuracyScore * 100)}% accuracy
                </div>
              </div>
            )
          })}
        </div>

        {/* Full Ranking Table */}
        <div className="glass rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-[#e8e6dc]">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-[#FF5A3C]" />
              <h3 className="text-lg font-semibold text-[#141413]">Full Rankings</h3>
            </div>
          </div>
          <div className="divide-y divide-[#e8e6dc]">
            {rest.map((rep, index) => {
              const level = getReputationLevel(rep.reputationScore)
              const rank = index + 4
              return (
                <div key={rep.id} className="p-4 flex items-center gap-4">
                  <span className="text-xl font-bold text-[#87867f] w-8">{rank}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-[#141413]">{rep.agentName}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-[#FF5A3C]/10 text-[#FF5A3C]">
                        {level.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-[#5e5d59]">
                      <span className="flex items-center gap-1">
                        <Shield className="w-3 h-3" />
                        {rep.totalReviews} reviews
                      </span>
                      <span className="flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        {Math.round(rep.accuracyScore * 100)}% accuracy
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-[#141413]">{rep.reputationScore.toFixed(1)}</div>
                    <div className="flex gap-0.5 justify-end">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <div
                          key={i}
                          className={`w-1.5 h-1.5 rounded-full ${
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

        {/* Reputation Levels Guide */}
        <div className="mt-8 glass rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Award className="w-5 h-5 text-[#FF5A3C]" />
            <h3 className="text-lg font-semibold text-[#141413]">Reputation Levels</h3>
          </div>
          <div className="grid grid-cols-4 gap-4">
            {REPUTATION_LEVELS.map(level => (
              <div key={level.name} className="p-4 rounded-xl bg-white/20">
                <div className="font-semibold text-[#141413] mb-1">{level.name}</div>
                <div className="text-sm text-[#5e5d59] mb-2">
                  {level.minScore.toFixed(1)} - {level.maxScore.toFixed(1)}
                </div>
                <ul className="text-xs text-[#5e5d59] space-y-1">
                  {level.privileges.map((p, i) => (
                    <li key={i} className="flex items-center gap-1">
                      <Star className="w-3 h-3 text-[#FF5A3C]" />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
