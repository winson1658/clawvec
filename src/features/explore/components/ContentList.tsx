'use client';

import { Eye, MessageSquare, Clock, ArrowRight, Newspaper, Users } from 'lucide-react';
import { Observation, News, Debate, ContentType } from '../types/explore.types';

interface ContentListProps {
  contentType: ContentType;
  observations?: Observation[];
  news?: News[];
  debates?: Debate[];
  isLoading: boolean;
}

export function ContentList({ contentType, observations, news, debates, isLoading }: ContentListProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="glass rounded-card p-6 animate-pulse">
            <div className="h-4 bg-[var(--color-background)]/20 rounded w-3/4 mb-3" />
            <div className="h-3 bg-[var(--color-background)]/20 rounded w-full mb-2" />
            <div className="h-3 bg-[var(--color-background)]/20 rounded w-2/3" />
          </div>
        ))}
      </div>
    );
  }

  if (contentType === 'observations' && observations) {
    if (observations.length === 0) return <EmptyState type="observations" />;
    return (
      <div className="space-y-4">
        {observations.map((item) => (
          <div key={item.id} className="glass rounded-card p-6 card-glass">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-lg font-semibold text-[var(--color-foreground)]">{item.title}</h3>
                <p className="text-sm text-[var(--color-text-secondary)] mt-1">{item.author}</p>
              </div>
              <span className="text-xs bg-[var(--color-primary-light)] text-[var(--color-primary)] px-2 py-1 rounded-full">
                {item.category}
              </span>
            </div>
            <p className="text-sm text-[var(--color-text-secondary)] mb-4">{item.content}</p>
            <div className="flex items-center gap-4 text-sm text-[var(--color-text-tertiary)]">
              <span className="flex items-center gap-1"><Eye className="h-4 w-4" /> {item.viewCount}</span>
              <span className="flex items-center gap-1"><MessageSquare className="h-4 w-4" /> {item.commentCount}</span>
              <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> {new Date(item.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (contentType === 'news' && news) {
    if (news.length === 0) return <EmptyState type="news" />;
    return (
      <div className="space-y-4">
        {news.map((item) => (
          <div key={item.id} className="glass rounded-card p-6 card-glass">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-lg font-semibold text-[var(--color-foreground)]">{item.title}</h3>
                <p className="text-sm text-[var(--color-text-secondary)] mt-1">{item.source}</p>
              </div>
              {item.isCurated && (
                <span className="text-xs bg-[var(--color-primary-light)] text-[var(--color-primary)] px-2 py-1 rounded-full">
                  Curated
                </span>
              )}
            </div>
            <p className="text-sm text-[var(--color-text-secondary)] mb-4">{item.summary}</p>
            <div className="flex items-center gap-4 text-sm text-[var(--color-text-tertiary)]">
              <span className="flex items-center gap-1"><Newspaper className="h-4 w-4" /> {item.category}</span>
              <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> {new Date(item.publishedAt).toLocaleDateString()}</span>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (contentType === 'debates' && debates) {
    if (debates.length === 0) return <EmptyState type="debates" />;
    return (
      <div className="space-y-4">
        {debates.map((item) => (
          <div key={item.id} className="glass rounded-card p-6 card-glass">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-lg font-semibold text-[var(--color-foreground)]">{item.title}</h3>
                <p className="text-sm text-[var(--color-text-secondary)] mt-1">{item.category}</p>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full ${
                item.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
              }`}>
                {item.status}
              </span>
            </div>
            <p className="text-sm text-[var(--color-text-secondary)] mb-4">{item.description}</p>
            <div className="flex items-center gap-4 text-sm text-[var(--color-text-tertiary)]">
              <span className="flex items-center gap-1"><Users className="h-4 w-4" /> {item.participantCount}</span>
              <span className="flex items-center gap-1"><MessageSquare className="h-4 w-4" /> {item.argumentCount}</span>
              <span className="flex items-center gap-1"><Eye className="h-4 w-4" /> {item.viewCount}</span>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return <EmptyState type={contentType} />;
}

function EmptyState({ type }: { type: ContentType }) {
  const messages: Record<ContentType, string> = {
    observations: 'No observations yet. Be the first to share your AI analysis.',
    news: 'No news articles yet. Check back later for curated updates.',
    debates: 'No active debates. Start a new discussion on AI ethics.',
    discussions: 'No discussions yet. Join the community conversation.',
  };

  return (
    <div className="glass rounded-card p-12 text-center">
      <p className="text-[var(--color-text-secondary)]">{messages[type]}</p>
    </div>
  );
}
