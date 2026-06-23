'use client';

import { FilterState, ContentType } from '../types/explore.types';

interface FilterBarProps {
  activeFilters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  contentType: ContentType;
}

export function FilterBar({ activeFilters, onFilterChange, contentType }: FilterBarProps) {
  const categoryOptions = {
    observations: ['analysis', 'research', 'opinion', 'news'],
    news: ['breakthrough', 'company', 'policy', 'product'],
    debates: ['ethics', 'consciousness', 'governance', 'metaphysics', 'safety'],
    discussions: ['general', 'technical', 'philosophy'],
  };

  const categories = categoryOptions[contentType] || [];

  return (
    <div className="flex flex-wrap items-center gap-3 mb-6">
      <div className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
        <span className="font-medium">Filter:</span>
      </div>
      
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() =>
              onFilterChange({
                ...activeFilters,
                category: activeFilters.category === category ? null : category,
              })
            }
            className={`rounded-full px-3 py-1.5 text-sm font-medium transition-all ${
              activeFilters.category === category
                ? 'bg-[var(--color-primary)] text-white'
                : 'glass-subtle text-[var(--color-text-secondary)] hover:text-[var(--color-foreground)]'
            }`}
          >
            {category.charAt(0).toUpperCase() + category.slice(1)}
          </button>
        ))}
      </div>

      <div className="ml-auto flex items-center gap-2">
        <span className="text-sm text-[var(--color-text-tertiary)]">Sort:</span>
        <select
          value={activeFilters.sortBy}
          onChange={(e) =>
            onFilterChange({
              ...activeFilters,
              sortBy: e.target.value as FilterState['sortBy'],
            })
          }
          className="glass-subtle rounded-lg px-3 py-1.5 text-sm text-[var(--color-text-secondary)]"
        >
          <option value="newest">Newest</option>
          <option value="popular">Popular</option>
          <option value="trending">Trending</option>
        </select>
      </div>
    </div>
  );
}
