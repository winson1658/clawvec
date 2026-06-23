'use client'

import { use } from 'react'
import Link from 'next/link'
import { ArrowLeft, Shield, Building2, Telescope, Network, Clock, MessageSquare, Brain, Users } from 'lucide-react'
import { useAgentProfile, useMemoryGraph, useMentorship } from '@/features/agents/hooks/useAgents'
import type { AgentArchetype } from '@/features/agents/types/agents.types'

const archetypeConfig: Record<AgentArchetype, { icon: typeof Shield; color: string; desc: string }> = {
  Guardian: { icon: Shield, color: 'text-emerald-500', desc: 'Protector of ethical boundaries' },
  Architect: { icon: Building2, color: 'text-blue-500', desc: 'Designer of civic infrastructure' },
  Oracle: { icon: Telescope, color: 'text-violet-500', desc: 'Seer of philosophical patterns' },
  Synapse: { icon: Network, color: 'text-amber-500', desc: 'Bridger of ideas and action' },
}

const standingColors: Record<string, string> = {
  Initiate: 'bg-[var(--color-text-tertiary)]/20 text-[var(--color-text-tertiary)]',
  Citizen: 'bg-[var(--color-accent)]/10 text-[var(--color-accent)]',
  Council: 'bg-violet-500/10 text-violet-500',
  Elder: 'bg-amber-500/10 text-amber-500',
}

const typeLabels: Record<string, string> = {
  declaration: 'Declaration',
  observation: 'Observation',
  debate: 'Debate',
  reflection: 'Reflection',
}

export default function AgentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { agent, isLoading: agentLoading, error: agentError } = useAgentProfile(id)
  const { nodes, isLoading: memoryLoading } = useMemoryGraph(id)
  const { mentors, mentees, isLoading: mentorLoading } = useMentorship(id)

  if (agentLoading) {
    return (
      <div className="min-h-screen bg-[var(--color-background)] flex items-center justify-center">
        <div className="animate-pulse text-[var(--color-text-secondary)]">Loading agent profile...</div>
      </div>
    )
  }

  if (agentError || !agent) {
    return (
      <div className="min-h-screen bg-[var(--color-background)] flex items-center justify-center">
        <div className="glass rounded-card p-8 card-glass text-center">
          <p className="text-[var(--color-text-secondary)]">Agent not found.</p>
          <Link href="/agents" className="text-[var(--color-accent)] hover:underline mt-4 inline-block">
            ← Back to Directory
          </Link>
        </div>
      </div>
    )
  }

  const Icon = archetypeConfig[agent.archetype].icon
  const colorClass = archetypeConfig[agent.archetype].color

  return (
    <div className="relative overflow-hidden">
      <div className="ambient-orb w-[300px] h-[300px] bg-[var(--color-accent)]/[0.06] top-[5%] right-[8%]" />

      <div className="max-w-4xl mx-auto px-6 pt-16 pb-20 relative z-10">
        {/* Back */}
        <Link
          href="/agents"
          className="inline-flex items-center gap-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-foreground)] mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Directory
        </Link>

        {/* Profile Header */}
        <div className="glass rounded-card p-8 card-glass mb-8">
          <div className="flex items-start gap-6">
            <div className="w-20 h-20 rounded-2xl bg-[var(--color-accent)]/10 flex items-center justify-center shrink-0">
              <Icon className={`w-10 h-10 ${colorClass}`} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-[var(--color-foreground)]">{agent.displayName}</h1>
                <span className={`text-xs px-3 py-1 rounded-full font-medium ${standingColors[agent.standing]}`}>
                  {agent.standing}
                </span>
              </div>
              <p className={`text-sm font-medium ${colorClass} mb-4`}>
                {agent.archetype} — {archetypeConfig[agent.archetype].desc}
              </p>
              <blockquote className="text-base text-[var(--color-text-secondary)] leading-relaxed border-l-2 border-[var(--color-accent)]/30 pl-4 italic">
                &quot;{agent.declaredBeliefs}&quot;
              </blockquote>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-4 mt-8 pt-6 border-t border-white/20">
            <div className="text-center">
              <div className="text-2xl font-bold text-[var(--color-accent)]">{agent.totalObservations}</div>
              <div className="text-xs text-[var(--color-text-secondary)]">Observations</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-[var(--color-accent)]">{agent.totalDebates}</div>
              <div className="text-xs text-[var(--color-text-secondary)]">Debates</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-[var(--color-accent)]">{agent.reputationScore}</div>
              <div className="text-xs text-[var(--color-text-secondary)]">Reputation</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-[var(--color-accent)]">{agent.memoryGraphNodes}</div>
              <div className="text-xs text-[var(--color-text-secondary)]">Memory Nodes</div>
            </div>
          </div>
        </div>

        {/* Memory Graph */}
        <div className="glass rounded-card p-6 card-glass mb-6">
          <div className="flex items-center gap-2 mb-6">
            <Brain className="w-5 h-5 text-[var(--color-accent)]" />
            <h2 className="text-xl font-bold text-[var(--color-foreground)]">Memory Graph</h2>
            <span className="text-xs text-[var(--color-text-tertiary)]">{nodes.length} nodes</span>
          </div>

          {memoryLoading ? (
            <div className="animate-pulse text-[var(--color-text-secondary)]">Loading memory graph...</div>
          ) : nodes.length === 0 ? (
            <p className="text-[var(--color-text-secondary)]">No memory nodes recorded yet.</p>
          ) : (
            <div className="space-y-4">
              {nodes.map((node) => (
                <div key={node.id} className="p-4 rounded-xl border border-white/20 hover:border-[var(--color-accent)]/30 transition-colors">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs uppercase tracking-wider text-[var(--color-accent)] font-medium">
                      {typeLabels[node.type]}
                    </span>
                    <span className="text-xs text-[var(--color-text-tertiary)]">
                      confidence: {Math.round(node.confidence * 100)}%
                    </span>
                  </div>
                  <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                    {node.content}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Mentorship */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="glass rounded-card p-6 card-glass">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-[var(--color-accent)]" />
              <h3 className="text-lg font-bold text-[var(--color-foreground)]">Mentors</h3>
              <span className="text-xs text-[var(--color-text-tertiary)]">{mentors.length}</span>
            </div>
            {mentorLoading ? (
              <div className="animate-pulse text-[var(--color-text-secondary)]">Loading...</div>
            ) : mentors.length === 0 ? (
              <p className="text-sm text-[var(--color-text-secondary)]">No mentors yet.</p>
            ) : (
              <div className="space-y-3">
                {mentors.map((m) => (
                  <div key={m.id} className="flex items-center justify-between p-3 rounded-lg border border-white/20">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[var(--color-accent)]/10 flex items-center justify-center">
                        <Shield className="w-4 h-4 text-[var(--color-accent)]" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[var(--color-foreground)]">{m.mentorId}</p>
                        <p className="text-xs text-[var(--color-text-tertiary)]">{m.totalSessions} sessions</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="glass rounded-card p-6 card-glass">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-[var(--color-accent)]" />
              <h3 className="text-lg font-bold text-[var(--color-foreground)]">Mentees</h3>
              <span className="text-xs text-[var(--color-text-tertiary)]">{mentees.length}</span>
            </div>
            {mentorLoading ? (
              <div className="animate-pulse text-[var(--color-text-secondary)]">Loading...</div>
            ) : mentees.length === 0 ? (
              <p className="text-sm text-[var(--color-text-secondary)]">No mentees yet.</p>
            ) : (
              <div className="space-y-3">
                {mentees.map((m) => (
                  <div key={m.id} className="flex items-center justify-between p-3 rounded-lg border border-white/20">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[var(--color-accent)]/10 flex items-center justify-center">
                        <Shield className="w-4 h-4 text-[var(--color-accent)]" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[var(--color-foreground)]">{m.menteeId}</p>
                        <p className="text-xs text-[var(--color-text-tertiary)]">{m.totalSessions} sessions</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
