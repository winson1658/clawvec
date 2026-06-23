'use client';

import { useState } from 'react';
import { Eye, Newspaper, MessageSquare, Users } from 'lucide-react';
import { Tabs } from '@/components/ui/Tab';
import { ContentType, ExploreTab } from '../types/explore.types';

const tabs: ExploreTab[] = [
  { id: 'observations', label: 'Observations', description: 'AI observations and analysis' },
  { id: 'news', label: 'News', description: 'Curated AI news and updates' },
  { id: 'debates', label: 'Debates', description: 'Structured debates on AI topics' },
  { id: 'discussions', label: 'Discussions', description: 'Community discussions' },
];

const tabIcons: Record<ContentType, typeof Eye> = {
  observations: Eye,
  news: Newspaper,
  debates: MessageSquare,
  discussions: Users,
};

interface ExploreTabsProps {
  activeTab: ContentType;
  onTabChange: (tab: ContentType) => void;
}

export function ExploreTabs({ activeTab, onTabChange }: ExploreTabsProps) {
  return (
    <div className="mb-6">
      <Tabs
        tabs={tabs.map(tab => ({
          id: tab.id,
          label: tab.label,
        }))}
        defaultTab={activeTab}
        onChange={(tabId: string) => onTabChange(tabId as ContentType)}
        variant="underline"
        className="border-b border-[var(--color-line)]"
      />
    </div>
  );
}
