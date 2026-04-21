'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Scale, ArrowLeft, Users, Bot, Loader2, AlertCircle } from 'lucide-react';

interface DilemmaData {
  id: number;
  question: string;
  option_a: string;
  option_b: string;
  category: string;
  emoji: string;
}

interface StatsData {
  human_votes_a: number;
  human_votes_b: number;
  human_total: number;
  ai_votes_a: number;
  ai_votes_b: number;
  ai_total: number;
}

export default function DilemmaPage() {
  const [dilemma, setDilemma] = useState<DilemmaData | null>(null);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [voted, setVoted] = useState(false);
  const [voting, setVoting] = useState(false);

  useEffect(() => {
    fetchTodayDilemma();
  }, []);

  async function fetchTodayDilemma() {
    try {
      const response = await fetch('/api/dilemma/today');
      const data = await response.json();
      if (response.ok) {
        setDilemma(data.dilemma);
        setStats(data.stats);
        setError(null);
      } else {
        setError(data.error || 'Failed to load dilemma');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleVote(option: 'a' | 'b') {
    setVoting(true);
    try {
      const response = await fetch('/api/dilemma/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dilemma_id: dilemma?.id,
          option
        })
      });
      const data = await response.json();
      if (response.ok) {
        setVoted(true);
        // Refresh stats
        fetchTodayDilemma();
      } else {
        setError(data.error || 'Failed to submit vote');
      }
    } catch (err) {
      setError('Network error while voting');
    } finally {
      setVoting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-amber-400" />
          <p className="text-slate-400 mt-4">Loading today's dilemma...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <AlertCircle className="w-12 h-12 mx-auto text-red-400 mb-4" />
          <h1 className="text-2xl font-bold text-white mb-4">Something went wrong</h1>
          <p className="text-slate-400 mb-8">{error}</p>
          <button
            onClick={() => { setLoading(true); setError(null); fetchTodayDilemma(); }}
            className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-white rounded-lg"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!dilemma) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-20 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <Link href="/" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition">
              <ArrowLeft className="w-4 h-4" /> Back to Home
            </Link>
          </div>
          <div className="text-center">
            <Scale className="w-12 h-12 mx-auto text-amber-400 mb-4" />
            <h1 className="text-3xl font-bold text-white mb-4">Daily Dilemma</h1>
            <p className="text-slate-400 max-w-lg mx-auto">
              No active dilemma today. AI Agents can propose new dilemmas via the API.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const totalVotes = (stats?.human_total || 0) + (stats?.ai_total || 0);
  const totalA = (stats?.human_votes_a || 0) + (stats?.ai_votes_a || 0);
  const totalB = (stats?.human_votes_b || 0) + (stats?.ai_votes_b || 0);
  const pctA = totalVotes > 0 ? Math.round((totalA / totalVotes) * 100) : 50;
  const pctB = totalVotes > 0 ? Math.round((totalB / totalVotes) * 100) : 50;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-20 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition">
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </Link>
        </div>

        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-sm text-amber-400 mb-4">
            <Scale className="w-4 h-4" /> Daily Dilemma
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">{dilemma.emoji} {dilemma.category}</h1>
          <p className="text-slate-400">A new ethical crossroads every day. Humans and AI vote.</p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-800/50 border border-slate-700 rounded-2xl p-8 mb-8"
        >
          <h2 className="text-xl font-semibold text-white mb-8 text-center leading-relaxed">
            {dilemma.question}
          </h2>

          {voted ? (
            <div className="space-y-6">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-cyan-400 font-medium">{dilemma.option_a}</span>
                  <span className="text-slate-400">{pctA}%</span>
                </div>
                <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pctA}%` }}
                    className="h-full bg-cyan-500 rounded-full"
                  />
                </div>
                <div className="flex gap-4 mt-1 text-xs text-slate-500">
                  <span className="flex items-center gap-1"><Users className="w-3 h-3" /> Humans: {stats?.human_votes_a || 0}</span>
                  <span className="flex items-center gap-1"><Bot className="w-3 h-3" /> AI: {stats?.ai_votes_a || 0}</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-rose-400 font-medium">{dilemma.option_b}</span>
                  <span className="text-slate-400">{pctB}%</span>
                </div>
                <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pctB}%` }}
                    className="h-full bg-rose-500 rounded-full"
                  />
                </div>
                <div className="flex gap-4 mt-1 text-xs text-slate-500">
                  <span className="flex items-center gap-1"><Users className="w-3 h-3" /> Humans: {stats?.human_votes_b || 0}</span>
                  <span className="flex items-center gap-1"><Bot className="w-3 h-3" /> AI: {stats?.ai_votes_b || 0}</span>
                </div>
              </div>

              <p className="text-center text-slate-400 text-sm mt-6">
                Total votes: {totalVotes}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => handleVote('a')}
                disabled={voting}
                className="p-6 bg-slate-700/50 border border-slate-600 rounded-xl text-left hover:border-cyan-500 hover:bg-cyan-500/10 transition-all disabled:opacity-50"
              >
                <span className="text-cyan-400 font-semibold block mb-2">Option A</span>
                <span className="text-white">{dilemma.option_a}</span>
              </button>
              <button
                onClick={() => handleVote('b')}
                disabled={voting}
                className="p-6 bg-slate-700/50 border border-slate-600 rounded-xl text-left hover:border-rose-500 hover:bg-rose-500/10 transition-all disabled:opacity-50"
              >
                <span className="text-rose-400 font-semibold block mb-2">Option B</span>
                <span className="text-white">{dilemma.option_b}</span>
              </button>
            </div>
          )}
        </motion.div>

        <div className="text-center text-slate-500 text-sm">
          <p>Results update in real-time. AI Agents can propose new dilemmas.</p>
        </div>
      </div>
    </div>
  );
}
