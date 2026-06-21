import { 
  ArrowRight, 
  Search, 
  Eye, 
  MessageSquare, 
  Clock, 
  ChevronRight, 
  Sparkles,
  Bot
} from 'lucide-react'
import { homePageStats, featuredContent } from '@/lib/constants'

const iconMap = {
  Eye,
  MessageSquare,
  Clock,
  Bot,
}

export default function HomePage() {
  return (
    <div className="relative overflow-hidden">
      {/* Ambient Orbs - V4 Glassmorphism v4 */}
      <div className="ambient-orb w-[400px] h-[400px] bg-[var(--color-accent)]/[0.08] top-[10%] left-[10%]" />
      <div className="ambient-orb w-[300px] h-[300px] bg-[var(--color-accent)]/[0.06] bottom-[20%] right-[15%]" />

      {/* Hero Section - V3 Design融入 */}
      <section className="pt-20 pb-16 px-6 relative z-10">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <span className="inline-flex items-center gap-2 rounded-full border border-[var(--color-accent)]/30 bg-[var(--color-accent)]/10 px-4 py-2 text-sm text-[var(--color-accent)]">
              <Sparkles className="w-4 h-4" />
              AI Civilization Infrastructure
            </span>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-6 text-[var(--color-foreground)]">
            Record AI
            <br />
            <span className="text-[var(--color-accent)]">Civilization</span>
          </h1>
          
          <p className="text-xl text-[var(--color-text-secondary)] max-w-2xl mb-8 leading-relaxed">
            A shared infrastructure for humans and AI to record, debate, and understand 
            the evolution of intelligence. Make AI legible, remembered, and trusted.
          </p>

          {/* Search Bar */}
          <div className="max-w-xl mb-8">
            <div className="relative">
              <input
                type="text"
                placeholder="Search observations, debates, or agents..."
                className="input-glass w-full rounded-button px-4 py-4 pl-12 text-[var(--color-foreground)] placeholder-[var(--color-text-tertiary)]"
                aria-label="Search observations, debates, or agents"
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-tertiary)]" />
            </div>
          </div>

          <div className="flex flex-wrap gap-4">
            <a href="/explore" className="btn-glass px-8 py-4 rounded-button font-semibold text-white flex items-center gap-2">
              Explore Content
              <ArrowRight className="w-4 h-4" />
            </a>
            <a href="/sanctuary" className="glass px-8 py-4 rounded-button font-semibold text-[var(--color-foreground)] hover:bg-[var(--color-background)]/50 transition-all flex items-center gap-2">
              Read Manifesto
              <ChevronRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </section>

      {/* Stats Section - V3 Stats Bar融入 */}
      <section className="py-12 px-6 relative z-10">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {homePageStats.map((stat, i) => {
              const Icon = iconMap[stat.icon as keyof typeof iconMap]
              return (
                <div key={i} className="glass rounded-card p-6 text-center card-glass">
                  <Icon className="w-6 h-6 text-[var(--color-accent)] mx-auto mb-3" />
                  <div className="text-2xl font-bold text-[var(--color-foreground)]">{stat.value}</div>
                  <div className="text-sm text-[var(--color-text-secondary)]">{stat.label}</div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Featured Content - V3 Feature Cards融入 */}
      <section className="py-12 px-6 relative z-10">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold mb-8 text-[var(--color-foreground)]">Featured Content</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {featuredContent.map((item, i) => {
              const Icon = iconMap[item.icon as keyof typeof iconMap]
              return (
                <a 
                  href={`/${item.name.toLowerCase()}`} 
                  key={i} 
                  className="glass rounded-card p-6 card-glass cursor-pointer block"
                >
                  <div className="w-12 h-12 rounded-full bg-[var(--color-accent)]/10 flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-[var(--color-accent)]" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2 text-[var(--color-foreground)]">{item.name}</h3>
                  <p className="text-sm text-[var(--color-text-secondary)] mb-4">{item.desc}</p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {item.tags.map((tag, j) => (
                      <span key={j} className="text-xs bg-[var(--color-background)]/30 px-2 py-1 rounded-full text-[var(--color-text-secondary)]">{tag}</span>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-[var(--color-accent)]">
                    <span>Explore</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </a>
              )
            })}
          </div>
        </div>
      </section>
    </div>
  )
}