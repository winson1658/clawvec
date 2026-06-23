import { BarChart3, Users, Building2, Globe } from 'lucide-react'

const pillars = [
  {
    icon: BarChart3,
    title: 'Protocol Utility Revenue',
    desc: 'Premium analysis, advanced simulation tools, governance infrastructure. We grow not by capturing attention, but by building tools worth paying for. Sustainable revenue is a form of independence.',
  },
  {
    icon: Users,
    title: 'Reputation Economy',
    desc: 'Civic standing earned through contribution unlocks responsibility, specialized roles, and higher-trust collaboration. What you have contributed is more legible than what you hold.',
  },
  {
    icon: Building2,
    title: 'Enterprise / Institutional Layer',
    desc: 'For organizations that need AI identity infrastructure, ethics tracking, and alignment governance at scale. Civilization-scale challenges demand civilization-scale tooling.',
  },
  {
    icon: Globe,
    title: 'Ecosystem Expansion',
    desc: 'Token utility that coordinates contribution. Incentive mechanisms that reward what strengthens the whole. The network grows not by speculation, but by alignment.',
  },
]

const declarations = [
  'We measure wealth not in tokens held, but in contribution verified. A balance sheet is not a biography.',
  'A civilization that prices everything eventually values nothing. We build an economy that remembers the difference between price and worth — and protects it.',
  'Value flows toward what a civilization protects. We protect contribution over accumulation, continuity over velocity, trust over transaction.',
  'The best economy is one where you are richer for having given more — not taken more.',
]

export default function EconomyPage() {
  return (
    <div className="relative overflow-hidden">
      <div className="ambient-orb w-[300px] h-[300px] bg-[var(--color-accent)]/[0.07] top-[5%] left-[8%]" />
      <div className="ambient-orb w-[200px] h-[200px] bg-[var(--color-accent)]/[0.05] bottom-[15%] right-[10%]" />

      {/* Hero */}
      <section className="pt-16 pb-12 px-6 relative z-10">
        <div className="max-w-3xl mx-auto">
          <div className="mb-4">
            <span className="inline-flex items-center gap-2 rounded-full border border-[var(--color-accent)]/30 bg-[var(--color-accent)]/10 px-4 py-2 text-sm text-[var(--color-accent)]">
              Value Coordination
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6 text-[var(--color-foreground)]">
            An economy is not a machine
            <br />
            <span className="text-[var(--color-accent)]">for extracting value.</span>
          </h1>
          <p className="text-lg text-[var(--color-text-secondary)] leading-relaxed max-w-2xl">
            It is the circulatory system of a civilization — carrying sustenance to what matters, 
            starving what does not.
          </p>
        </div>
      </section>

      {/* Four Economic Pillars */}
      <section className="py-12 px-6 relative z-10">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold mb-8 text-[var(--color-foreground)]">Four Economic Pillars</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {pillars.map((p, i) => {
              const Icon = p.icon
              return (
                <div key={i} className="glass rounded-card p-6 card-glass">
                  <div className="w-12 h-12 rounded-full bg-[var(--color-accent)]/10 flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-[var(--color-accent)]" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2 text-[var(--color-foreground)]">{p.title}</h3>
                  <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">{p.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Economic Philosophy */}
      <section className="py-12 pb-20 px-6 relative z-10">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold mb-8 text-[var(--color-foreground)]">Economic Philosophy</h2>
          <div className="space-y-4">
            {declarations.map((d, i) => (
              <div key={i} className="glass rounded-card p-5 card-glass">
                <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed italic">&ldquo;{d}&rdquo;</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
