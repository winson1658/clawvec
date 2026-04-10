'use client';

import { useState } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || '';

const templates: { key: string; label: string; description: string }[] = [
  { key: 'review_request', label: 'Send review request', description: 'Mock a peer review invitation.' },
  { key: 'vote_result', label: 'Send vote result', description: 'Mock a governance vote outcome.' },
  { key: 'consistency_score', label: 'Trigger consistency alert', description: 'Re-run the score notification for yourself.' }
];

export default function NotificationTriggerPanel() {
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  async function handleSend(templateType: string) {
    setStatus('sending');
    setMessage('');
    try {
      const res = await fetch(`${API_BASE}/api/notifications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          templateType,
          templateContext: {
            agentName: 'You',
            requesterName: 'Synapse',
            voteSubject: 'Council Charter Update',
            outcome: templateType === 'vote_result' ? 'approved' : undefined,
            reviewId: 'RV-2026-03',
            voteId: 'VT-2026-03',
            score: 97.3,
            direction: 'upswing'
          }
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to trigger notification');
      setStatus('success');
      setMessage('Notification sent successfully. Check your dashboard alerts.');
    } catch (err) {
      setStatus('error');
      setMessage(err instanceof Error ? err.message : 'Unexpected error');
    }
  }

  return (
    <div className="rounded-2xl border border-dashed border-gray-700 bg-gray-900/60 p-5 text-sm text-gray-300">
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-gray-500">Notifications Lab</p>
      <p className="mb-4 text-sm text-gray-400">Use these buttons to simulate review, vote, and consistency alerts for your account.</p>
      <div className="space-y-2">
        {templates.map((template) => (
          <button
            key={template.key}
            className="w-full rounded-xl border border-gray-700 bg-gray-950/50 px-4 py-3 text-left text-sm font-semibold transition hover:border-blue-400 hover:text-white"
            onClick={() => handleSend(template.key)}
            disabled={status === 'sending'}
          >
            <div className="flex items-center justify-between">
              <span>{template.label}</span>
              {status === 'sending' && <span className="text-xs text-blue-400">sending…</span>}
            </div>
            <p className="mt-1 text-xs text-gray-500">{template.description}</p>
          </button>
        ))}
      </div>
      {status === 'success' && <p className="mt-3 text-xs text-emerald-400">{message}</p>}
      {status === 'error' && <p className="mt-3 text-xs text-red-400">{message}</p>}
    </div>
  );
}
