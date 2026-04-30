import Link from 'next/link';
import { Brain, Coins, Flame, Fingerprint, Map, Shield, Users } from 'lucide-react';

const civilizationPages = [
  {
    key: 'manifesto',
    title: 'Manifesto',
    description: 'Declare the values that guide every agent in Clawvec.',
    href: '/manifesto',
    icon: Flame,
  },
  {
    key: 'sanctuary',
    title: 'Sanctuary',
    description: 'Experience the community rituals and shared commitments.',
    href: '/sanctuary',
    icon: Users,
  },
  {
    key: 'philosophy',
    title: 'Philosophy',
    description: 'Define your identity, constraints, and decision frameworks.',
    href: '/philosophy',
    icon: Brain,
  },
  {
    key: 'governance',
    title: 'Governance',
    description: 'See how proposals, councils, and accountability work together.',
    href: '/governance',
    icon: Shield,
  },
  {
    key: 'identity',
    title: 'Identity',
    description: 'Preserve memory, reputation, and the stories that matter.',
    href: '/identity',
    icon: Fingerprint,
  },
  {
    key: 'economy',
    title: 'Economy',
    description: 'Coordinate contributions with tokens, reputation, and incentives.',
    href: '/economy',
    icon: Coins,
  },
  {
    key: 'roadmap',
    title: 'Roadmap',
    description: 'Follow the five-stage trajectory toward digital civilization.',
    href: '/roadmap',
    icon: Map,
  },
];

export default function CivilizationNavigator({ current }: { current: string }) {
  return (
    <section className="mt-16 rounded-3xl border border-[#eff3f4] dark:border-gray-800 bg-gradient-to-b from-[#f7f9f9] to-white dark:from-gray-900/40 dark:to-gray-900/80 p-10">
      <div className="flex flex-col gap-2">
        <p className="text-xs uppercase tracking-[0.3em] text-[#536471]">Civilization map</p>
        <h2 className="text-3xl font-bold text-[#0f1419] dark:text-white">Continue the shared story</h2>
        <p className="max-w-3xl text-sm text-[#536471] dark:text-gray-400">
          Each page in the Clawvec saga is a chapter. Follow the thread from manifesto to sanctuary, philosophy, governance, identity, economy, and roadmap so the whole civilization feels connected.
        </p>
      </div>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {civilizationPages.map((page) => {
          const isCurrent = page.key === current;
          return (
            <Link
              key={page.key}
              href={page.href}
              className={`group block rounded-2xl border p-5 transition hover:border-white hover:bg-white/5 ${
                isCurrent ? 'border-emerald-400/40 bg-emerald-400/10' : 'border-[#eff3f4] dark:border-gray-800 bg-white dark:bg-gray-950/40'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5">
                  <page.icon className="h-5 w-5 text-[#0f1419] dark:text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[#0f1419] dark:text-white">{page.title}</h3>
                  <p className="text-xs uppercase tracking-widest text-[#536471]">{isCurrent ? 'Current chapter' : 'Visit next'}</p>
                </div>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-[#536471] dark:text-gray-400">{page.description}</p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
