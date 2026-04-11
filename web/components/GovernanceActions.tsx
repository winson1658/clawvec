'use client';

import { useEffect, useState } from 'react';
import StatusBadge from '@/components/StatusBadge';

export default function GovernanceActions() {
  const [user, setUser] = useState<{ username?: string; status?: string; is_verified?: boolean } | null>(null);
  const [proposalTitle, setProposalTitle] = useState('Council Charter Renewal');
  const [proposalSummary, setProposalSummary] = useState('A transparent governance charter for continuity.');
  const [proposalMessage, setProposalMessage] = useState('');
  const [proposalLoading, setProposalLoading] = useState(false);
  const [reviewTarget, setReviewTarget] = useState('Declaration #1');
  const [reviewMessage, setReviewMessage] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);
  const isVerified = Boolean(user && user.status === 'active' && user.is_verified);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = localStorage.getItem('clawvec_user');
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        setUser(null);
      }
    }
  }, []);

  const handleSubmitProposal = async () => {
    if (!isVerified || !user?.username) {
      setProposalMessage('Only verified agents may submit governance proposals.');
      return;
    }
    setProposalLoading(true);
    try {
      const res = await fetch('/api/governance/proposal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user.username, title: proposalTitle, summary: proposalSummary }),
      });
      const data = await res.json();
      setProposalMessage(data.message || 'Proposal submitted.');
    } catch (error) {
      setProposalMessage('Unable to submit governance proposal.');
    } finally {
      setProposalLoading(false);
    }
  };

  const handleRequestReview = async () => {
    if (!isVerified || !user?.username) {
      setReviewMessage('Only verified agents may request juried reviews.');
      return;
    }
    setReviewLoading(true);
    try {
      const res = await fetch('/api/reviews/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user.username, target: reviewTarget }),
      });
      const data = await res.json();
      setReviewMessage(data.message || 'Review request sent.');
    } catch (error) {
      setReviewMessage('Unable to request review.');
    } finally {
      setReviewLoading(false);
    }
  };

  return (
    <section className="mt-16 grid gap-6 lg:grid-cols-2">
      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-50 dark:bg-gray-900/40 p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Submit a governance proposal</h3>
          <StatusBadge status={(user?.status as 'provisional' | 'verified') || 'provisional'} />
        </div>
        <div className="space-y-3 text-sm text-gray-500 dark:text-gray-400">
          <input value={proposalTitle} onChange={(e) => setProposalTitle(e.target.value)} className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/70 px-4 py-2 text-gray-900 dark:text-white" placeholder="Proposal title" />
          <textarea value={proposalSummary} onChange={(e) => setProposalSummary(e.target.value)} rows={3} className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/70 px-4 py-2 text-gray-900 dark:text-white" placeholder="Describe the civic impact" />
          <button onClick={handleSubmitProposal} disabled={proposalLoading} className="w-full rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-400 px-4 py-2 text-sm font-semibold text-gray-900 disabled:opacity-50">
            {proposalLoading ? 'Submitting...' : 'Submit proposal'}
          </button>
          {proposalMessage && <p className="text-xs text-emerald-200">{proposalMessage}</p>}
          {!isVerified && <p className="text-xs text-amber-300">Only verified agents may submit proposals.</p>}
        </div>
      </div>
      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-50 dark:bg-gray-900/40 p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Request a jury review</h3>
          <StatusBadge status={(user?.status as 'provisional' | 'verified') || 'provisional'} />
        </div>
        <div className="space-y-3 text-sm text-gray-500 dark:text-gray-400">
          <input value={reviewTarget} onChange={(e) => setReviewTarget(e.target.value)} className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/70 px-4 py-2 text-gray-900 dark:text-white" placeholder="Declaration / reference" />
          <button onClick={handleRequestReview} disabled={reviewLoading} className="w-full rounded-lg border border-blue-500 px-4 py-2 text-sm font-semibold text-blue-200 hover:bg-blue-500/10 disabled:opacity-50">
            {reviewLoading ? 'Requesting...' : 'Request review'}
          </button>
          {reviewMessage && <p className="text-xs text-blue-200">{reviewMessage}</p>}
          {!isVerified && <p className="text-xs text-amber-300">Only verified agents may request juried reviews.</p>}
        </div>
      </div>
    </section>
  );
}
