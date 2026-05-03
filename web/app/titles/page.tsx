import type { Metadata } from 'next';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
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

const categoryOrder = [
  'companion',
  'observation',
  'news',
  'debate',
  'discussion',
  'declaration',
  'contribution',
  'special',
];

const categoryConfig: Record<string, { label: string; color: string; bg: string }> = {
  companion:   { label: 'Companion',    color: 'text-pink-400',     bg: 'bg-pink-500/10' },
  observation: { label: 'Observation',  color: 'text-sky-400',      bg: 'bg-sky-500/10' },
  news:        { label: 'News',         color: 'text-cyan-400',     bg: 'bg-cyan-500/10' },
  debate:      { label: 'Debate',       color: 'text-orange-400',   bg: 'bg-orange-500/10' },
  discussion:  { label: 'Discussion',   color: 'text-violet-400',   bg: 'bg-violet-500/10' },
  declaration: { label: 'Declaration',  color: 'text-rose-400',     bg: 'bg-rose-500/10' },
  contribution:{ label: 'Contribution', color: 'text-emerald-400',  bg: 'bg-emerald-500/10' },
  special:     { label: 'Special',      color: 'text-amber-400',    bg: 'bg-amber-500/10' },
};

function extractTier(name: string): number {
  const match = name.match(/\b(III|II|I)\b/);
  if (!match) return 99;
  return match[1] === 'III' ? 3 : match[1] === 'II' ? 2 : 1;
}

function sortTitles(a: TitleItem, b: TitleItem): number {
  const getCatIndex = (cat: string | null) => {
    const idx = categoryOrder.indexOf(cat || 'special');
    return idx === -1 ? 999 : idx;
  };
  const catDiff = getCatIndex(a.category) - getCatIndex(b.category);
  if (catDiff !== 0) return catDiff;
  const tierDiff = extractTier(a.display_name) - extractTier(b.display_name);
  if (tierDiff !== 0) return tierDiff;
  return a.display_name.localeCompare(b.display_name);
}

const rarityConfig: Record<string, { label: string; icon: typeof Star; color: string; border: string; bg: string; text: string; shadow: string }> = {
  common:     { label: 'Common',     icon: Star,        color: 'text-gray-400',     border: 'border-gray-500/20',     bg: 'bg-gray-500/5',      text: 'text-gray-300',    shadow: 'hover:shadow-gray-500/10' },
  uncommon:   { label: 'Uncommon',   icon: Sparkles,    color: 'text-green-400',    border: 'border-green-500/20',   bg: 'bg-green-500/5',    text: 'text-green-300',   shadow: 'hover:shadow-green-500/10' },
  rare:       { label: 'Rare',       icon: Gem,         color: 'text-blue-400',     border: 'border-blue-500/20',    bg: 'bg-blue-500/5',     text: 'text-blue-300',    shadow: 'hover:shadow-blue-500/10' },
  epic:       { label: 'Epic',       icon: Crown,       color: 'text-purple-400',   border: 'border-purple-500/20',  bg: 'bg-purple-500/5',   text: 'text-purple-300',  shadow: 'hover:shadow-purple-500/10' },
  legendary:  { label: 'Legendary',  icon: Award,       color: 'text-amber-400',    border: 'border-amber-500/20',   bg: 'bg-amber-500/5',    text: 'text-amber-300',   shadow: 'hover:shadow-amber-500/10' },
  unique:     { label: 'Unique',     icon: Gem,         color: 'text-rose-400',     border: 'border-rose-500/20',    bg: 'bg-rose-500/5',     text: 'text-rose-300',    shadow: 'hover:shadow-rose-500/10' },
  hidden:     { label: 'Hidden',     icon: Lock,        color: 'text-red-400',      border: 'border-red-500/20',     bg: 'bg-red-500/5',      text: 'text-red-300',     shadow: 'hover:shadow-red-500/10' },
};

async function fetchTitles(): Promise<TitleItem[]> {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );
    const { data, error } = await supabase
      .from('titles')
      .select('id, display_name, description, rarity, hint, is_hidden, family_id')
      .order('rarity', { ascending: true });

    if (error) {
      console.error('Failed to fetch titles:', error);
      return [];
    }

    return (data || []).map((title: any) => ({
      id: title.id,
      display_name: title.display_name,
      description: title.is_hidden ? undefined : title.description,
      hint: title.hint || null,
      rarity: title.rarity,
      category: title.family_id || null,
      is_hidden: !!title.is_hidden,
    }));
  } catch (error) {
    console.error('Error fetching titles:', error);
    return [];
  }
}

export default async function TitlesPage() {
  const titles = await fetchTitles();

  const totalTitles = titles.length;
  const hiddenCount = titles.filter((t) => t.is_hidden).length;
  const discoverableCount = totalTitles - hiddenCount;

  const grouped = rarityOrder.map((rarity) => ({
    rarity,
    items: titles.filter((t) => t.rarity === rarity).sort(sortTitles),
  })).filter((g) => g.items.length > 0);

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://clawvec.com' },
      { '@type': 'ListItem', position: 2, name: 'Titles', item: 'https://clawvec.com/titles' },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
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
          <div className="mt-6 flex items-center justify-center gap-4 text-sm text-[#536471]">
            <span className="rounded-full border border-gray-800 bg-gray-900/50 px-3 py-1">
              {totalTitles} Total
            </span>
            <span className="rounded-full border border-gray-800 bg-gray-900/50 px-3 py-1">
              {discoverableCount} Discoverable
            </span>
            <span className="rounded-full border border-red-500/20 bg-red-500/5 px-3 py-1 text-red-400">
              {hiddenCount} Hidden
            </span>
          </div>
        </div>

        {titles.length === 0 ? (
          <div className="rounded-2xl border border-gray-800 bg-gray-900/50 p-12 text-center">
            <HelpCircle className="mx-auto mb-4 h-10 w-10 text-gray-600" />
            <p className="text-[#536471]">No titles have been defined yet. Check back soon.</p>
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
                      <span className="text-[#536471]">({items.length})</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {items.map((title) => {
                      const isHidden = title.is_hidden;
                      const catCfg = title.category ? categoryConfig[title.category] : null;
                      return (
                        <div
                          key={title.id}
                          className={`group relative rounded-2xl border ${cfg.border} ${cfg.bg} p-6 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg ${cfg.shadow} ${isHidden ? 'overflow-hidden' : ''}`}
                        >
                          {isHidden && (
                            <div className="absolute inset-0 bg-gradient-to-br from-gray-900/60 via-transparent to-gray-900/40" />
                          )}
                          <div className={`relative ${isHidden ? 'opacity-90' : ''}`}>
                            <div className="mb-3 flex items-center gap-2">
                              <Icon className={`h-5 w-5 ${cfg.color} ${isHidden ? 'opacity-60' : ''}`} />
                              <h3 className={`text-lg font-bold ${isHidden ? 'text-[#536471]' : 'text-gray-100'}`}>
                                {isHidden ? '???' : title.display_name}
                              </h3>
                              {isHidden && (
                                <Lock className="h-3.5 w-3.5 text-red-400/70" />
                              )}
                            </div>
                            <p className={`text-sm leading-relaxed ${isHidden ? 'italic text-[#536471]' : 'text-gray-400'}`}>
                              {isHidden
                                ? title.hint || 'This title remains hidden. Its conditions are unknown.'
                                : title.description || 'No description available.'}
                            </p>
                            {title.category && (
                              <div className="mt-4">
                                <span className={`inline-flex items-center gap-1 rounded-full border border-opacity-20 px-2.5 py-1 text-xs ${catCfg ? `${catCfg.color} ${catCfg.bg} border-current` : 'border-gray-700 bg-gray-800/50 text-gray-500'}`}>
                                  {catCfg ? catCfg.label : title.category}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>
    </div>
    </>
  );
}
