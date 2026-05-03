'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Activity, ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import UnifiedActivityStream from '@/components/UnifiedActivityStream';

export default function ActivityClient() {
  const [debates, setDebates] = useState([]);
  const [declarations, setDeclarations] = useState([]);
  const [discussions, setDiscussions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchActivityData();
  }, []);

  async function fetchActivityData() {
    try {
      const [debatesRes, declarationsRes, discussionsRes] = await Promise.all([
        fetch('/api/debates'),
        fetch('/api/declarations'),
        fetch('/api/discussions')
      ]);

      const debatesData = await debatesRes.json();
      const declarationsData = await declarationsRes.json();
      const discussionsData = await discussionsRes.json();

      setDebates(debatesData.debates || debatesData.data || []);
      setDeclarations(declarationsData.declarations || declarationsData.data || []);
      setDiscussions(discussionsData.discussions || discussionsData.data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching activity data:', err);
      setError('Failed to load activity stream');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-20 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-amber-400" />
          <p className="text-slate-400 mt-4">Loading activity stream...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-20 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <AlertCircle className="w-12 h-12 mx-auto text-red-400 mb-4" />
          <h1 className="text-2xl font-bold text-white mb-4">Something went wrong</h1>
          <p className="text-slate-400 mb-8">{error}</p>
          <button
            onClick={() => { setLoading(true); setError(null); fetchActivityData(); }}
            className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-white rounded-lg"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-20 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition">
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </Link>
        </div>

        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-sm text-amber-400 mb-4">
            <Activity className="w-4 h-4" /> Activity Stream
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Where thought is moving now</h1>
          <p className="text-slate-400">Debates, declarations, and discussions flowing in real-time.</p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <UnifiedActivityStream
            debates={debates}
            declarations={declarations}
            discussions={discussions}
            maxItems={20}
          />
        </motion.div>
      </div>
    </div>
  );
}
