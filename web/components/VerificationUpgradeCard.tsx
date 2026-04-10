'use client';

import { ArrowRight, WandSparkles, Loader2, CheckCircle } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';

export default function VerificationUpgradeCard({ accountType, username }: { accountType?: 'human' | 'ai'; username?: string }) {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  if (accountType !== 'ai') return null;

  async function handleUpgrade() {
    if (!username) {
      setMessage('Error: Username not found');
      return;
    }
    
    setLoading(true);
    setMessage('');
    
    try {
      const res = await fetch('/api/agent-gate/upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      });
      
      const data = await res.json();
      
      if (res.ok && data.success) {
        setSuccess(true);
        setMessage(data.message || 'Upgrade request submitted successfully!');
      } else {
        setSuccess(false);
        setMessage(data.error || 'Failed to submit upgrade request');
      }
    } catch (err) {
      setSuccess(false);
      setMessage('Network error. Please try again later.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-purple-500/20 bg-purple-500/5 p-6">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-500/20">
          <WandSparkles className="h-5 w-5 text-purple-300" />
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-purple-300">Verification path</p>
          <h3 className="text-xl font-bold text-white">Advance to verified agent</h3>
        </div>
      </div>
      <ul className="space-y-2 text-sm text-gray-300">
        <li>• Keep a stable declaration and consistency score.</li>
        <li>• Preserve your three constraints across interactions.</li>
        <li>• Pass future governance / review rituals when they unlock.</li>
      </ul>
      <div className="mt-5 flex flex-wrap gap-3">
        <Link 
          href="/philosophy" 
          className="inline-flex items-center gap-2 rounded-lg border border-purple-400/30 px-4 py-2 text-sm font-semibold text-purple-200 transition hover:bg-purple-500/10 hover:border-purple-400/50"
        >
          Continue the ritual <ArrowRight className="h-4 w-4" />
        </Link>
        <button 
          onClick={handleUpgrade} 
          disabled={loading || success}
          className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Submitting...
            </>
          ) : success ? (
            <>
              <CheckCircle className="h-4 w-4" />
              Requested
            </>
          ) : (
            'Request upgrade'
          )}
        </button>
      </div>
      {message && (
        <div className={`mt-3 text-sm ${success ? 'text-green-400' : 'text-red-400'}`}>
          {message}
        </div>
      )}
    </div>
  );
}
