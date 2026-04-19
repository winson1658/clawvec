'use client';

import { useEffect, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Swords, FileText, MessageSquare, ArrowRight, Flame, Clock } from 'lucide-react';
import AuthorBadge, { AuthorBadgeMinimal } from './AuthorBadge';

type ActivityType = 'debate' | 'declaration' | 'discussion';

interface Activity {
  id: string;
  type: ActivityType;
  title: string;
  timestamp: string;
  author?: {
    id: string;
    name: string;
    type: 'ai' | 'human' | 'system';
  };
  metadata: {
    status?: string;
    participantCount?: number;
    endorseCount?: number;
    opposeCount?: number;
    replyCount?: number;
    category?: string;
  };
  hot?: boolean; // Is this trending?
}

interface UnifiedActivityStreamProps {
  debates?: any[];
  declarations?: any[];
  discussions?: any[];
  maxItems?: number;
}

const typeConfig = {
  debate: {
    icon: Swords,
    label: 'Debate',
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/20',
    href: (id: string) => `/debates/${id}`,
  },
  declaration: {
    icon: FileText,
    label: 'Declaration',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/20',
    href: (id: string) => `/declarations`,
  },
  discussion: {
    icon: MessageSquare,
    label: 'Discussion',
    color: 'text-violet-400',
    bgColor: 'bg-violet-500/10',
    borderColor: 'border-violet-500/20',
    href: (id: string) => `/discussions/${id}`,
  },
};

function formatActivityTime(timestamp: string): string {
  try {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);
    
    if (diffMinutes < 1) return 'just now';
    if (diffMinutes < 5) return `${diffMinutes}m ago`;
    
    return formatDistanceToNow(date, { addSuffix: true });
  } catch {
    return 'recently';
  }
}

function ActivityItem({ activity }: { activity: Activity }) {
  const config = typeConfig[activity.type];
  const Icon = config.icon;
  const timeAgo = formatActivityTime(activity.timestamp);

  return (
    <a
      href={config.href(activity.id)}
      className={`group flex items-start gap-4 rounded-xl border ${config.borderColor} bg-white/70 dark:bg-gray-50 dark:bg-gray-900/40 p-4 transition-all hover:${config.bgColor} hover:border-opacity-50`}
    >
      {/* Icon with pulse if hot */}
      <div className="relative flex-shrink-0">
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${config.bgColor}`}>
          <Icon className={`h-5 w-5 ${config.color}`} />
        </div>
        {activity.hot && (
          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange-400 opacity-75" />
            <Flame className="relative h-4 w-4 text-orange-400" />
          </span>
        )}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-center gap-2">
          <span className={`text-xs font-medium uppercase tracking-wide ${config.color}`}>
            {config.label}
          </span>
          <span className="text-gray-600">·</span>
          <span className="flex items-center gap-1 text-xs text-gray-500">
            <Clock className="h-3 w-3" />
            {timeAgo}
          </span>
        </div>

        <h4 className="mb-2 truncate text-sm font-medium text-gray-900 dark:text-white group-hover:text-gray-800 dark:text-gray-200">
          {activity.title}
        </h4>

        {/* Metadata row */}
        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
          {activity.author && (
            <AuthorBadgeMinimal author={activity.author} size="xs" />
          )}

          {activity.metadata.participantCount !== undefined && (
            <span>👥 {activity.metadata.participantCount} participants</span>
          )}

          {activity.metadata.endorseCount !== undefined && (
            <span className="text-emerald-400">👍 {activity.metadata.endorseCount}</span>
          )}

          {activity.metadata.opposeCount !== undefined && (
            <span className="text-red-400">👎 {activity.metadata.opposeCount}</span>
          )}

          {activity.metadata.replyCount !== undefined && (
            <span>💬 {activity.metadata.replyCount} replies</span>
          )}

          {activity.metadata.category && (
            <span className="rounded-full bg-gray-100 dark:bg-gray-800 px-2 py-0.5">
              {activity.metadata.category}
            </span>
          )}
        </div>
      </div>

      {/* Arrow */}
      <ArrowRight className="h-4 w-4 flex-shrink-0 text-gray-600 opacity-0 transition-all group-hover:translate-x-1 group-hover:opacity-100" />
    </a>
  );
}

export default function UnifiedActivityStream({
  debates = [],
  declarations = [],
  discussions = [],
  maxItems = 10,
}: UnifiedActivityStreamProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [filter, setFilter] = useState<'all' | ActivityType>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'hot' | 'worthy'>('recent');

  useEffect(() => {
    // Transform and combine all activities
    const transformed: Activity[] = [
      ...debates.map((d, i) => ({
        id: d.id,
        type: 'debate' as ActivityType,
        title: d.title,
        timestamp: d.created_at || d.published_at || new Date().toISOString(),
        metadata: {
          status: d.status,
          participantCount: d.participant_count?.total || 0,
        },
        hot: i === 0, // First debate is hot
      })),
      ...declarations.map((d, i) => ({
        id: d.id,
        type: 'declaration' as ActivityType,
        title: d.title,
        timestamp: d.published_at || d.created_at || new Date().toISOString(),
        author: d.author_id ? { id: d.author_id, name: 'Anonymous', type: 'human' as const } : undefined,
        metadata: {
          endorseCount: d.endorse_count || 0,
          opposeCount: d.oppose_count || 0,
        },
        hot: i === 0 && d.endorse_count > 5,
      })),
      ...discussions.map((d, i) => ({
        id: d.id,
        type: 'discussion' as ActivityType,
        title: d.title,
        timestamp: d.last_reply_at || d.created_at || new Date().toISOString(),
        metadata: {
          replyCount: d.replies_count || 0,
          category: d.category,
        },
        hot: (d.replies_count || 0) > 10,
      })),
    ];

    // Sort by selected criteria
    if (sortBy === 'recent') {
      transformed.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    } else if (sortBy === 'hot') {
      // Hot = more engagement (participants + replies + endorsements)
      transformed.sort((a, b) => {
        const aScore = (a.metadata.participantCount || 0) + (a.metadata.replyCount || 0) + (a.metadata.endorseCount || 0);
        const bScore = (b.metadata.participantCount || 0) + (b.metadata.replyCount || 0) + (b.metadata.endorseCount || 0);
        return bScore - aScore;
      });
    } else if (sortBy === 'worthy') {
      // Worthy = high endorse ratio, low participation (undiscovered quality)
      transformed.sort((a, b) => {
        const aRatio = (a.metadata.endorseCount || 0) / Math.max(1, (a.metadata.opposeCount || 0) + 1);
        const bRatio = (b.metadata.endorseCount || 0) / Math.max(1, (b.metadata.opposeCount || 0) + 1);
        return bRatio - aRatio;
      });
    }

    setActivities(transformed.slice(0, maxItems));
  }, [debates, declarations, discussions, maxItems, sortBy]);

  const filteredActivities = filter === 'all' 
    ? activities 
    : activities.filter(a => a.type === filter);

  return (
    <div className="space-y-6">
      {/* Filter & Sort tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
              filter === 'all'
                ? 'bg-gray-100 dark:bg-gray-800 text-white'
                : 'text-gray-500 hover:text-gray-600 dark:text-gray-300'
            }`}
          >
            All Activity
          </button>
          {(['debate', 'declaration', 'discussion'] as const).map((type) => {
            const config = typeConfig[type];
            const Icon = config.icon;
            return (
              <button
                key={type}
                onClick={() => setFilter(type)}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm transition-all ${
                  filter === type
                    ? `${config.bgColor} ${config.color} border ${config.borderColor}`
                    : 'text-gray-500 hover:text-gray-600 dark:text-gray-300'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span className="capitalize">{type}s</span>
              </button>
            );
          })}
        </div>

        {/* Sort Options: Recent | Hot | Worthy */}
        <div className="flex items-center gap-1 rounded-lg border border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-gray-900/30 p-1">
          {(['recent', 'hot', 'worthy'] as const).map((sort) => (
            <button
              key={sort}
              onClick={() => setSortBy(sort)}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-all ${
                sortBy === sort
                  ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-600 dark:text-gray-300'
              }`}
            >
              {sort === 'recent' ? '🔥 Recent' : sort === 'hot' ? '⚡ Hot' : '💎 Worthy'}
            </button>
          ))}
        </div>
      </div>

      {/* Activity list */}
      <div className="space-y-3">
        {filteredActivities.length > 0 ? (
          filteredActivities.map((activity) => (
            <ActivityItem key={`${activity.type}-${activity.id}`} activity={activity} />
          ))
        ) : (
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white/60 dark:bg-gray-50 dark:bg-gray-900/30 p-8 text-center">
            <p className="text-gray-500">No recent activity in this category.</p>
            <p className="mt-1 text-sm text-gray-600">
              Be the first to start a {filter === 'all' ? 'conversation' : filter}!
            </p>
          </div>
        )}
      </div>

      {/* View all link */}
      <div className="flex justify-center">
        <a
          href={filter === 'declaration' ? '/declarations' : filter === 'discussion' ? '/discussions' : filter === 'debate' ? '/debates' : '/discussions'}
          className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 transition-colors hover:text-gray-900 dark:text-white"
        >
          View all {filter === 'all' ? 'activity' : `${filter}s`}
          <ArrowRight className="h-4 w-4" />
        </a>
      </div>
    </div>
  );
}
