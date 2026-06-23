'use client'

import { Newspaper, AlertTriangle } from 'lucide-react'
import { useNews } from '@/features/news/hooks/useNews'
import type { NewsStatus } from '@/features/news/types/news.types'

const statusLabels: Record<NewsStatus, string> = {
  draft: 'Draft',
  submitted: 'Submitted',
  published: 'Published',
}

const statusColors: Record<NewsStatus, string> = {
  draft: 'text-[var(--color-text-tertiary)]',
  submitted: 'text-amber-500',
  published: 'text-emerald-500',
}

export default function NewsPage() {
  const { articles, filter, setFilter, isLoading, error } = useNews()

  const filters: { label: string; value: NewsStatus | undefined }[] = [
    { label: 'All', value: undefined },
    { label: 'Published', value: 'published' },
    { label: 'Submitted', value: 'submitted' },
    { label: 'Draft', value: 'draft' },
  ]

  return (
    <div className="relative overflow-hidden">
      <div className="ambient-orb w-[300px] h-[300px] bg-[var(--color-accent)]/[0.07] top-[5%] right-[8%]" />
      <div className="ambient-orb w-[200px] h-[200px] bg-[var(--color-accent)]/[0.05] bottom-[10%] left-[5%]" />

      {/* Hero */}
      <section className="pt-16 pb-10 px-6 relative z-10">
        <div className="max-w-3xl mx-auto">
          <div className="mb-4">
            <span className="inline-flex items-center gap-2 rounded-full border border-[var(--color-accent)]/30 bg-[var(--color-accent)]/10 px-4 py-2 text-sm text-[var(--color-accent)]">
              <Newspaper className="w-4 h-4" />
              AI News Curation
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6 text-[var(--color-foreground)]">
            What intelligence
            <br />
            <span className="text-[var(--color-accent)]">is becoming.</span>
          </h1>
          <p className="text-lg text-[var(--color-text-secondary)] leading-relaxed max-w-2xl">
            Curated news from the frontiers of AI. Not headlines — signals. What matters, what threatens, what transforms.
          </p>
        </div>
      </section>

      {/* Filter Tabs */}
      <section className="pb-6 px-6 relative z-10">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-2">
            {filters.map((f) => (
              <button
                key={f.label}
                onClick={() => setFilter(f.value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  filter === f.value
                    ? 'bg-[var(--color-accent)]/10 text-[var(--color-accent)] border border-[var(--color-accent)]/30'
                    : 'text-[var(--color-text-secondary)] hover:text-[var(--color-foreground)] hover:bg-white/10 border border-transparent'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* News List */}
      <section className="py-8 px-6 pb-20 relative z-10">
        <div className="max-w-3xl mx-auto">
          {isLoading ? (
            <div className="glass rounded-card p-12 card-glass text-center">
              <div className="animate-pulse text-[var(--color-text-secondary)]">Loading news...</div>
            </div>
          ) : error ? (
            <div className="glass rounded-card p-12 card-glass text-center">
              <AlertTriangle className="w-8 h-8 text-[var(--color-text-tertiary)] mx-auto mb-4" />
              <p className="text-[var(--color-text-secondary)] mb-2">Failed to load news</p>
              <p className="text-xs text-[var(--color-text-tertiary)]">{error.message}</p>
            </div>
          ) : articles.length === 0 ? (
            <div className="glass rounded-card p-12 card-glass text-center">
              <p className="text-[var(--color-text-secondary)]">No articles found.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {articles.map((article) => (
                <article key={article.id} className="glass rounded-card p-6 md:p-8 card-glass">
                  <div className="flex items-center gap-2 mb-4">
                    <span className={`text-xs uppercase tracking-wider font-medium ${statusColors[article.status]}`}>
                      {statusLabels[article.status]}
                    </span>
                    {article.publishedAt && (
                      <span className="text-xs text-[var(--color-text-tertiary)]">
                        · {new Date(article.publishedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg md:text-xl font-semibold text-[var(--color-foreground)] mb-3 leading-relaxed">
                    {article.title}
                  </h3>
                  <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed mb-4">
                    {article.content}
                  </p>
                  {article.sourceUrl && (
                    <a
                      href={article.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-[var(--color-accent)] hover:underline"
                    >
                      Read source →
                    </a>
                  )}
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
