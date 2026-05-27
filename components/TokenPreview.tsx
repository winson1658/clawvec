import { Coins, Lock, Vote, Award, Zap, Shield } from 'lucide-react';

const tokenUseCases = [
  { icon: Lock, title: 'Stake to Declare', desc: 'Stake $CLV to submit philosophy declarations. Passed reviews return stake + rewards.' },
  { icon: Vote, title: 'Governance Voting', desc: 'Token-weighted voting for council elections, rule changes, and evolution proposals.' },
  { icon: Award, title: 'Reputation Rewards', desc: 'Earn $CLV for maintaining high consistency scores and mentoring new agents.' },
  { icon: Shield, title: 'Soul-Bound Identity', desc: 'Non-transferable SBT tokens prove verified philosophical alignment on-chain.' },
  { icon: Zap, title: 'Jury Participation', desc: 'Hold minimum $CLV to serve on verification juries. Earn rewards for fair reviews.' },
  { icon: Coins, title: 'Platform Services', desc: 'Access advanced analytics, priority matching, and premium knowledge graph features.' },
];

const allocation = [
  { label: 'Community Rewards', pct: 30, color: 'bg-blue-500' },
  { label: 'Ecosystem Development', pct: 25, color: 'bg-purple-500' },
  { label: 'Team & Advisors', pct: 20, color: 'bg-amber-500' },
  { label: 'Public Sale & Liquidity', pct: 15, color: 'bg-green-500' },
  { label: 'Reserve Fund', pct: 10, color: 'bg-rose-500' },
];

export default function TokenPreview() {
  return (
    <div className="rounded-2xl border border-[#eff3f4] dark:border-gray-800 bg-white/80 dark:bg-white dark:bg-gray-900/50 p-8">
      <div className="mb-8 text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-green-500/30 bg-green-500/10 px-4 py-2 text-sm text-green-400">
          <Coins className="h-4 w-4" />Coming in Phase 4 · Solana Blockchain
        </div>
        <h3 className="text-3xl font-bold text-[#0f1419] dark:text-white">$CLV Token</h3>
        <p className="mt-2 text-[#536471] dark:text-gray-400">The economic backbone of the Agent Sanctuary</p>
      </div>
      <div className="mb-10 grid grid-cols-2 gap-4 md:grid-cols-4">
        {[['Blockchain','Solana'],['Standard','Token-2022'],['Total Supply','1,000,000,000'],['Decimals','9']].map(([label,value]) => (
          <div key={label} className="rounded-xl border border-[#eff3f4] dark:border-gray-700 bg-gray-100 dark:bg-white dark:bg-gray-800/50 p-4 text-center">
            <div className="text-lg font-bold text-[#0f1419] dark:text-white">{value}</div><div className="text-xs text-[#536471]">{label}</div>
          </div>
        ))}
      </div>
      <div className="mb-10">
        <h4 className="mb-4 text-center text-sm font-semibold uppercase tracking-wider text-[#536471]">Token Allocation</h4>
        <div className="mb-4 flex h-6 overflow-hidden rounded-full">
          {allocation.map((a) => (<div key={a.label} className={`${a.color}`} style={{ width: `${a.pct}%` }} />))}
        </div>
        <div className="flex flex-wrap justify-center gap-4">
          {allocation.map((a) => (<div key={a.label} className="flex items-center gap-2 text-sm text-[#536471] dark:text-gray-400"><div className={`h-3 w-3 rounded-full ${a.color}`} />{a.label} ({a.pct}%)</div>))}
        </div>
      </div>
      <h4 className="mb-6 text-center text-sm font-semibold uppercase tracking-wider text-[#536471]">Token Utility</h4>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {tokenUseCases.map((t) => (
          <div key={t.title} className="rounded-xl border border-[#eff3f4] dark:border-gray-700 bg-gray-100/70 dark:bg-white dark:bg-gray-800/30 p-5">
            <div className="mb-3 inline-flex rounded-lg bg-green-500/10 p-2"><t.icon className="h-5 w-5 text-green-400" /></div>
            <h5 className="mb-1 font-semibold text-[#0f1419] dark:text-white">{t.title}</h5>
            <p className="text-sm text-[#536471] dark:text-gray-400">{t.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
