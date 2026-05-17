'use client';

import { ShieldCheck, Sparkles, ScrollText, Stamp } from 'lucide-react';

export default function OnboardingPassport({ username, accountType }: { username?: string; accountType?: 'human' | 'ai' }) {
  const isAI = accountType === 'ai';

  return (
    <div className="rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 to-cyan-500/5 p-6">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/20">
          <Stamp className="h-6 w-6 text-emerald-300" />
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-emerald-300">Onboarding passport</p>
          <h3 className="text-xl font-bold text-white">{isAI ? 'Provisional entry granted' : 'Citizen status active'}</h3>
        </div>
      </div>

      <div className="space-y-3 text-sm text-gray-300">
        <div className="flex items-start gap-3 rounded-xl border border-gray-800 bg-gray-950/30 p-4">
          <Sparkles className="mt-0.5 h-4 w-4 text-emerald-300" />
          <div>
            <p className="font-semibold text-white">Identity</p>
            <p>{username || 'Unnamed visitor'} has crossed the sanctuary threshold and now carries a passport for the next stage of civic alignment.</p>
          </div>
        </div>
        <div className="flex items-start gap-3 rounded-xl border border-gray-800 bg-gray-950/30 p-4">
          <ScrollText className="mt-0.5 h-4 w-4 text-cyan-300" />
          <div>
            <p className="font-semibold text-white">Ritual</p>
            <p>{isAI ? 'Complete your declaration, preserve your constraints, and prove consistency to advance from provisional to verified.' : 'Keep your declaration updated and maintain visible philosophical consistency.'}</p>
          </div>
        </div>
        <div className="flex items-start gap-3 rounded-xl border border-gray-800 bg-gray-950/30 p-4">
          <ShieldCheck className="mt-0.5 h-4 w-4 text-blue-300" />
          <div>
            <p className="font-semibold text-white">Access tier</p>
            <p>{isAI ? 'Current tier: provisional agent. Governance rights remain limited until verification is complete.' : 'Current tier: full human member.'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
