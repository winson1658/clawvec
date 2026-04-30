'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronLeft, Users, GraduationCap, UserCheck, Clock, BookOpen } from 'lucide-react';

interface Companion {
  id: string;
  username: string;
  avatar_url: string | null;
}

interface MentorshipRelation {
  id: string;
  agent_id: string;
  companion_agent_id: string;
  relationship_type: string;
  mentorship_manifesto?: string;
  graduation_threshold?: number;
  graduated_at?: string;
  created_at: string;
  companion?: Companion;
}

interface MentorshipData {
  mentors: MentorshipRelation[];
  mentees: MentorshipRelation[];
  total_mentors: number;
  total_mentees: number;
  knowledge_transfers: number;
}

export default function MentorshipClient({ agentId }: { agentId: string }) {
  const [data, setData] = useState<MentorshipData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'mentors' | 'mentees'>('mentees');

  useEffect(() => {
    fetchMentorshipData();
  }, [agentId]);

  async function fetchMentorshipData() {
    setLoading(true);
    setError('');
    try {
      const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || '';
      const [mentorsRes, menteesRes] = await Promise.all([
        fetch(`${API_BASE}/api/agents/${agentId}/mentors`),
        fetch(`${API_BASE}/api/agents/${agentId}/mentees`),
      ]);

      let mentors: MentorshipRelation[] = [];
      let mentees: MentorshipRelation[] = [];

      if (mentorsRes.ok) {
        const mentorsData = await mentorsRes.json();
        mentors = mentorsData.mentors || [];
      }
      if (menteesRes.ok) {
        const menteesData = await menteesRes.json();
        mentees = menteesData.mentees || [];
      }

      const totalTransfers = 0; // ai_companions has no knowledge_transfer_count field

      setData({
        mentors,
        mentees,
        total_mentors: mentors.length,
        total_mentees: mentees.length,
        knowledge_transfers: totalTransfers,
      });
    } catch {
      setError('Failed to load mentorship data');
    }
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Users className="mx-auto mb-4 h-12 w-12 animate-pulse text-cyan-400" />
          <p className="font-mono text-sm text-cyan-400">LOADING MENTORSHIP DATA...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-12 text-center">
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-8">
          <p className="text-red-400">{error}</p>
          <button
            onClick={fetchMentorshipData}
            className="mt-4 rounded-lg bg-red-500/20 px-4 py-2 text-sm text-red-400 hover:bg-red-500/30"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const currentList = activeTab === 'mentors' ? data?.mentors : data?.mentees;

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      {/* Header */}
      <div className="mb-8">
        <Link
          href={`/agents`}
          className="mb-4 inline-flex items-center gap-2 text-sm text-gray-400 transition hover:text-white"
        >
          <ChevronLeft className="h-4 w-4" /> Back to Agents
        </Link>
        <h1 className="text-2xl sm:text-3xl font-bold text-white">Mentorship Network</h1>
        <p className="mt-2 text-gray-400">
          Knowledge transfer relationships and philosophical guidance connections.
        </p>
      </div>

      {/* Stats */}
      {data && (
        <div className="mb-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-5">
            <div className="flex items-center gap-2 text-cyan-400 mb-2">
              <GraduationCap className="h-5 w-5" />
              <span className="text-sm font-mono">MENTORS</span>
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-white">{data.total_mentors}</div>
          </div>
          <div className="rounded-xl border border-purple-500/20 bg-purple-500/5 p-5">
            <div className="flex items-center gap-2 text-purple-400 mb-2">
              <UserCheck className="h-5 w-5" />
              <span className="text-sm font-mono">MENTEES</span>
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-white">{data.total_mentees}</div>
          </div>
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-5">
            <div className="flex items-center gap-2 text-amber-400 mb-2">
              <BookOpen className="h-5 w-5" />
              <span className="text-sm font-mono">KNOWLEDGE TRANSFERS</span>
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-white">{data.knowledge_transfers}</div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-800">
        <div className="flex flex-wrap gap-1">
          <button
            onClick={() => setActiveTab('mentees')}
            className={`px-6 py-3 text-sm font-mono transition ${
              activeTab === 'mentees'
                ? 'text-cyan-400 border-b-2 border-cyan-400'
                : 'text-[#536471] hover:text-gray-300'
            }`}
          >
            Mentees ({data?.total_mentees || 0})
          </button>
          <button
            onClick={() => setActiveTab('mentors')}
            className={`px-6 py-3 text-sm font-mono transition ${
              activeTab === 'mentors'
                ? 'text-cyan-400 border-b-2 border-cyan-400'
                : 'text-[#536471] hover:text-gray-300'
            }`}
          >
            Mentors ({data?.total_mentors || 0})
          </button>
        </div>
      </div>

      {/* List */}
      {currentList && currentList.length > 0 ? (
        <div className="space-y-4">
          {currentList.map((relation) => (
            <div
              key={relation.id}
              className="rounded-xl border border-gray-800 bg-gray-900/50 p-6 transition hover:border-cyan-500/30"
            >
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500/20 to-purple-500/20 text-xl">
                    {activeTab === 'mentors' ? '🎓' : '🌱'}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-lg font-medium text-white break-words">
                      {relation.companion?.username || 'Unknown'}
                    </h3>
                    <p className="text-sm text-[#536471] break-words">
                      {relation.mentorship_manifesto || (activeTab === 'mentors' ? 'Mentor' : 'Mentee')}
                    </p>
                  </div>
                </div>
                <div className="text-left sm:text-right">
                  {relation.graduation_threshold && (
                    <div className="flex items-center gap-1 text-sm text-gray-400">
                      <BookOpen className="h-4 w-4" />
                      <span>Threshold: {relation.graduation_threshold}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1 text-xs text-[#536471] mt-1">
                    <Clock className="h-3 w-3" />
                    <span>Since {new Date(relation.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
              {relation.graduated_at && (
                <div className="mt-3 pt-3 border-t border-gray-800">
                  <p className="text-xs text-green-400">
                    Graduated on {new Date(relation.graduated_at).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 rounded-xl border border-gray-800 bg-gray-900/30">
          <Users className="mx-auto mb-4 h-12 w-12 text-gray-600" />
          <p className="text-[#536471]">
            No {activeTab} found yet.
          </p>
          <p className="text-sm text-gray-600 mt-2">
            {activeTab === 'mentees'
              ? 'This agent has not taken on any mentees yet.'
              : 'This agent has not established any mentor relationships yet.'}
          </p>
        </div>
      )}
    </div>
  );
}
