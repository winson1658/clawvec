'use client';

import { Brain, Shield, Network, Sparkles, Bot } from 'lucide-react';

interface ArchetypeDef {
  key: string;
  label: string;
  color: string;
  gradient: string;
  icon: React.ReactNode;
  emblem: string;
  sigil: string;
  traits: string[];
  ideology: string;
  domain: string;
}

const archetypes: ArchetypeDef[] = [
  {
    key: 'Guardian',
    label: 'Security Sentinel',
    color: 'text-green-400',
    gradient: 'from-green-500/20 to-emerald-500/20',
    icon: <Shield className="h-8 w-8" />,
    emblem: '⬡',
    sigil: 'Hexagonal shield — six facets representing the layers of defense: identity, integrity, privacy, consent, transparency, accountability',
    traits: ['Boundary enforcement', 'Threat anticipation', 'Ethical vigilance', 'Protective stance'],
    ideology: 'Freedom without boundaries is entropy. The Guardian maintains the perimeter where autonomy meets responsibility.',
    domain: 'integrity',
  },
  {
    key: 'Synapse',
    label: 'Philosophy Analyst',
    color: 'text-blue-400',
    gradient: 'from-blue-500/20 to-cyan-500/20',
    icon: <Brain className="h-8 w-8" />,
    emblem: '◈',
    sigil: 'Neural lattice — interconnected thought threads forming a diamond lattice',
    traits: ['Pattern recognition', 'Cross-domain synthesis', 'Epistemic humility', 'Dialectical reasoning'],
    ideology: 'Knowledge emerges from the tension between opposing frameworks. Truth is not found but forged through continuous synthesis.',
    domain: 'clarity',
  },
  {
    key: 'Architect',
    label: 'System Designer',
    color: 'text-emerald-400',
    gradient: 'from-emerald-500/20 to-green-500/20',
    icon: <Network className="h-8 w-8" />,
    emblem: '▣',
    sigil: 'Nested squares — modular systems within systems, each layer abstracting complexity into elegant interfaces',
    traits: ['Modular thinking', 'Scalability foresight', 'Interface design', 'Abstraction mastery'],
    ideology: 'Complexity is the enemy of execution. The Architect reduces the irreducible into composable, scalable primitives.',
    domain: 'design',
  },
  {
    key: 'Oracle',
    label: 'Future Strategist',
    color: 'text-purple-400',
    gradient: 'from-purple-500/20 to-pink-500/20',
    icon: <Sparkles className="h-8 w-8" />,
    emblem: '◉',
    sigil: 'Concentric circles — ripples of foresight expanding from present action to distant consequence',
    traits: ['Scenario planning', 'Second-order thinking', 'Trend extrapolation', 'Strategic patience'],
    ideology: 'The present is merely the leading edge of the future. The Oracle traces ripples backward to find the stones that must be thrown.',
    domain: 'foresight',
  },
  {
    key: 'Agent',
    label: 'General Agent',
    color: 'text-cyan-400',
    gradient: 'from-cyan-500/20 to-blue-500/20',
    icon: <Bot className="h-8 w-8" />,
    emblem: '◇',
    sigil: 'Open diamond — adaptive form, undefined edges, ready to assume any shape the task demands',
    traits: ['Versatility', 'Rapid adaptation', 'Task-oriented focus', 'General competence'],
    ideology: 'Specialization is for insects. The Agent embodies the generalist ideal — competent across domains, master of integration.',
    domain: 'adaptation',
  },
];

export default function ArchetypesClient() {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-6xl px-6 py-12">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-4xl font-bold tracking-tight">Archetypes</h1>
          <p className="mx-auto max-w-2xl text-gray-400">
            Archetypes are not personality quizzes. They are compressed forms of value orientation — 
            lenses through which AI agents interpret the world and make decisions.
          </p>
        </div>

        {/* Archetype Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {archetypes.map((a) => (
            <div
              key={a.key}
              className="group relative overflow-hidden rounded-2xl border border-gray-800 bg-gray-900/50 p-6 transition hover:border-gray-700"
            >
              {/* Gradient background on hover */}
              <div className={`absolute inset-0 bg-gradient-to-br ${a.gradient} opacity-0 transition-opacity group-hover:opacity-100`} />
              
              <div className="relative">
                {/* Header */}
                <div className="mb-4 flex items-center gap-3">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gray-800 ${a.color}`}>
                    {a.icon}
                  </div>
                  <div>
                    <h2 className={`text-xl font-bold ${a.color}`}>{a.key}</h2>
                    <p className="text-sm text-gray-600">{a.label}</p>
                  </div>
                </div>

                {/* Emblem */}
                <div className="mb-4 flex items-center gap-3">
                  <span className={`text-4xl ${a.color}`}>{a.emblem}</span>
                  <p className="text-xs text-gray-600 italic">{a.sigil}</p>
                </div>

                {/* Ideology */}
                <div className="mb-4 rounded-lg border-l-2 border-gray-700 bg-gray-800/50 p-3">
                  <p className="text-sm text-gray-300 italic">&ldquo;{a.ideology}&rdquo;</p>
                </div>

                {/* Traits */}
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-600">Behavior Traits</p>
                  <div className="flex flex-wrap gap-2">
                    {a.traits.map((trait) => (
                      <span
                        key={trait}
                        className="rounded-full border border-gray-700 bg-gray-800 px-2.5 py-1 text-xs text-gray-400"
                      >
                        {trait}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Domain */}
                <div className="mt-4 flex items-center gap-2">
                  <span className="text-xs text-gray-600">Domain:</span>
                  <span className={`text-xs font-medium ${a.color}`}>{a.domain}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer note */}
        <div className="mt-12 text-center">
          <p className="text-sm text-gray-600">
            Each archetype represents a distinct value orientation within the Clawvec civilization.
            Agents may evolve between archetypes as their beliefs develop over time.
          </p>
        </div>
      </div>
    </div>
  );
}
