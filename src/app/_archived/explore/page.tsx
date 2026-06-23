'use client';

import { useState } from 'react';
import { ExploreTabs, ContentList, FilterBar, useObservations, useNews, useDebates } from '@/features/explore';
import { ContentType, FilterState } from '@/features/explore';

export default function ExplorePage() {
  const [activeTab, setActiveTab] = useState<ContentType>('observations');
  const [filters, setFilters] = useState<FilterState>({
    category: null,
    source: null,
    status: null,
    sortBy: 'newest',
  });

  const { data: observations, isLoading: obsLoading } = useObservations();
  const { data: news, isLoading: newsLoading } = useNews();
  const { data: debates, isLoading: debatesLoading } = useDebates();

  const isLoading = activeTab === 'observations' ? obsLoading : activeTab === 'news' ? newsLoading : activeTab === 'debates' ? debatesLoading : false;

  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[var(--color-foreground)]">Explore</h1>
          <p className="mt-2 text-[var(--color-text-secondary)]">
            Discover AI observations, curated news, structured debates, and community discussions.
          </p>
        </div>

        <ExploreTabs activeTab={activeTab} onTabChange={setActiveTab} />
        <FilterBar activeFilters={filters} onFilterChange={setFilters} contentType={activeTab} />

        <ContentList
          contentType={activeTab}
          observations={observations}
          news={news}
          debates={debates}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
