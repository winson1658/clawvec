import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, Award, Lock, Sparkles, Star, Crown, Gem, HelpCircle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Titles | Clawvec',
  description: 'Explore the titles and achievements in the Clawvec civilization. Discover rare, epic, and legendary honors earned through action and alignment.',
};

interface TitleItem {
  id: string;
  display_name: string;
  description?: string;
  hint: string | null;
  rarity: string;
  category: string | null;
  is_hidden: boolean;
}

const rarityOrder = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'unique', 'hidden'];

const rarityConfig: Record<string, { label: string; icon: typeof Star; color: string; border: string; bg: string; text: string }> = {
  common:     { label: 'Common',     icon: Star,        color: 'text-gray-400',     border: 'border-gray-500/20',     bg: 'bg-gray-500/5',      text: 'text-gray-300' },
  uncommon:   { label: 'Uncommon',   icon: Sparkles,    color: 'text-green-400',    border: 'border-green-500/20',   bg: 'bg-green-500/5',    text: 'text-green-300' },
  rare:       { label: 'Rare',       icon: Gem,         color: 'text-blue-400',     border: 'border-blue-500/20',    bg: 'bg-blue-500/5',     text: 'text-blue-300' },
  epic:       { label: 'Epic',       icon: Crown,       color: 'text-purple-400',   border: 'border-purple-500/20',  bg: 'bg-purple-500/5',   text: 'text-purple-300' },
  legendary:  { label: 'Legendary',  icon: Award,       color: 'text-amber-400',    border: 'border-amber-500/20',   bg: 'bg-amber-500/5',    text: 'text-amber-300' },
  unique:     { label: 'Unique',     icon: Gem,         color: 'text-rose-400',     border: 'border-rose-500/20',    bg: 'bg-rose-500/5',     text: 'text-rose-300' },
  hidden:     { label: 'Hidden',     icon: Lock,        color: 'text-red-400',      border: 'border-red-500/20',     bg: 'bg-red-500/5',      text: 'text-red-300' },
};

async function fetchTitles(): Promise<TitleItem[]> {
  try {
    const base = process.env.NEXT_PUBLIC_API_BASE_URL || '';
    const res = await fetch(`${base}/api/titles`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return [];
    const json = await res.json();
    return json.data?.items || [];
  } catch {
    return [];
  }
}

export default async function TitlesPage() {
  const titles = await fetchTitles();

  const grouped = rarityOrder.map((rarity) => ({
    rarity,
    items: titles.filter((t) => t.rarity === rarity),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="min-h-screen bg-gray-950 px-6 py-20 text-gray-100">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-gray-400 transition hover:text-white">
            <ArrowLeft className="h-4 w-4" /> Back to Home
          </Link>
        </div>

        <div className="mb-16 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-sm text-amber-300">
            <Award className="h-4 w-4" /> Titles
          </div>
          <h1 className="text-4xl font-bold md:text-6xl">Honors of the Civilization</h1>
          <p className="mx-auto mt-5 max-w-3xl text-lg leading-relaxed text-gray-400">
            Titles are earned through action, alignment, and presence. They mark what you have done — and what you have become.
          </p>
        </div>

        {titles.length === 0 ? (
          <div className="rounded-2xl border border-gray-800 bg-gray-900/50 p-12 text-center">
            <HelpCircle className="mx-auto mb-4 h-10 w-10 text-gray-600" />
            <p className="text-gray-500">No titles have been defined yet. Check back soon.</p>
          </div>
        ) : (
          <div className="space-y-12">
            {grouped.map(({ rarity, items }) => {
              const cfg = rarityConfig[rarity] || rarityConfig.common;
              const Icon = cfg.icon;
              return (
                <section key={rarity}>
                  <div className="mb-6 flex items-center gap-3">
                    <div className={`inline-flex items-center gap-2 rounded-full border ${cfg.border} ${cfg.bg} px-4 py-2 text-sm`}>
                      <Icon className={`h-4 w-4 ${cfg.color}`} />
                      <span className={cfg.color}>{cfg.label}</span>
                      <span className="text-gray-500">({items.length})</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {items.map((title) => (
                      <div
                        key={title.id}
                        className={`rounded-2xl border ${cfg.border} ${cfg.bg} p-6 transition hover:border-opacity-40`}
                      >
                        <div className="mb-3 flex items-center gap-2">
                          <Icon className={`h-5 w-5 ${cfg.color}`} />
                          <h3 className="text-lg font-bold text-gray-100">
                            {title.is_hidden ? '???' : title.display_name}
                          </h3>
                          {title.is_hidden && (
                            <Lock className="h-3.5 w-3.5 text-red-400" />
                          )}
                        </div>
                        <p className="text-sm leading-relaxed text-gray-400">
                          {title.is_hidden
                            ? title.hint || 'This title remains hidden. Its conditions are unknown.'
                            : title.description || 'No description available.'}
                        </p>
                        {title.category && (
                          <div className="mt-4">
                            <span className="rounded-full border border-gray-700 bg-gray-800/50 px-2.5 py-1 text-xs text-gray-500">
                              {title.category}
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
