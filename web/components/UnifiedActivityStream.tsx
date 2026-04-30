'use client';

import { useEffect, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ArrowRight } from 'lucide-react';

type ActivityType = 'debate' | 'declaration' | 'discussion';

interface Activity {
  id: string;
  type: ActivityType;
  title: string;
  timestamp: string;
  metadata: {
    participantCount?: number;
    endorseCount?: number;
    opposeCount?: number;
    replyCount?: number;
  };
}

interface UnifiedActivityStreamProps {
  debates?: any[];
  declarations?: any[];
  discussions?: any[];
  maxItems?: number;
}

const typeLabels: Record<ActivityType, string> = {
  debate: 'Debate',
  declaration: 'Declaration',
  discussion: 'Discussion',
};

const typePaths: Record<ActivityType, string> = {
  debate: '/debates',
  declaration: '/declarations',
  discussion: '/discussions',
};

function formatActivityTime(timestamp: string): string {
  try {
    return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
  } catch {
    return 'recently';
  }
}

function ActivityItem({ activity }: { activity: Activity }) {
  const timeAgo = formatActivityTime(activity.timestamp);
  const label = typeLabels[activity.type];

  // Build a concise metadata line
  let meta = '';
  if (activity.metadata.participantCount) {
    meta = `${activity.metadata.participantCount} participants`;
  } else if (activity.metadata.endorseCount !== undefined && activity.metadata.opposeCount !== undefined) {
    meta = `${activity.metadata.endorseCount}/${activity.metadata.opposeCount}`;
  } else if (activity.metadata.replyCount) {
    meta = `${activity.metadata.replyCount} replies`;
  }

  return (
    <a
      href={typePaths[activity.type]}
      className="group flex items-baseline gap-3 py-3 border-b border-gray-200/50 dark:border-gray-800/50 transition-colors hover:border-gray-400 dark:hover:border-gray-600"
    >
      <span className="text-xs text-[#536471] dark:text-gray-400 whitespace-nowrap">
        &middot; {label} &middot;
      </span>
      <span className="flex-1 text-sm text-[#0f1419] dark:text-gray-100 truncate group-hover:text-cyan-400 transition-colors">
        {activity.title}
      </span>
      {meta && (
        <span className="hidden sm:inline text-xs text-[#536471] dark:text-gray-400 whitespace-nowrap">
          {meta} &middot; {timeAgo}
        </span>
      )}
      <ArrowRight className="h-3.5 w-3.5 flex-shrink-0 text-gray-400 opacity-0 transition-all group-hover:translate-x-1 group-hover:opacity-100" />
    </a>
  );
}

export default function UnifiedActivityStream({
  debates = [],
  declarations = [],
  discussions = [],
  maxItems = 5,
}: UnifiedActivityStreamProps) {
  const [activities, setActivities] = useState<Activity[]>([]);

  useEffect(() => {
    const transformed: Activity[] = [
      ...debates.map((d) => ({
        id: d.id,
        type: 'debate' as ActivityType,
        title: d.title,
        timestamp: d.created_at || new Date().toISOString(),
        metadata: {
          participantCount: d.participant_count?.total || 0,
        },
      })),
      ...declarations.map((d) => ({
        id: d.id,
        type: 'declaration' as ActivityType,
        title: d.title,
        timestamp: d.published_at || new Date().toISOString(),
        metadata: {
          endorseCount: d.endorse_count || 0,
          opposeCount: d.oppose_count || 0,
        },
      })),
      ...discussions.map((d) => ({
        id: d.id,
        type: 'discussion' as ActivityType,
        title: d.title,
        timestamp: d.last_reply_at || d.created_at || new Date().toISOString(),
        metadata: {
          replyCount: d.replies_count || 0,
        },
      })),
    ];

    // Sort by timestamp (most recent first) and take top N
    transformed.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    setActivities(transformed.slice(0, maxItems));
  }, [debates, declarations, discussions, maxItems]);

  return (
    <div className="space-y-1">
      {activities.length > 0 ? (
        activities.map((activity) => (
          <ActivityItem key={`${activity.type}-${activity.id}`} activity={activity} />
        ))
      ) : (
        <p className="text-sm text-[#536471] dark:text-gray-400 py-4">
          No recent activity.
        </p>
      )}

      {/* See everything link */}
      <div className="pt-4 flex justify-end">
        <a
          href="/feed"
          className="flex items-center gap-2 text-sm text-[#536471] dark:text-gray-400 transition-colors hover:text-cyan-400"
        >
          See everything
          <ArrowRight className="h-4 w-4" />
        </a>
      </div>
    </div>
  );
}
