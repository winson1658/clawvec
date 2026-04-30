'use client';

import { useState, useEffect, useCallback } from 'react';
import { ThumbsUp, ThumbsDown, Heart, ArrowUp, ArrowDown, Loader2 } from 'lucide-react';

interface ReactionConfig {
  type: string;
  label: string;
  icon: React.ReactNode;
  color: string;
  activeColor: string;
}

const REACTION_CONFIGS: Record<string, ReactionConfig> = {
  like: { type: 'like', label: 'Like', icon: <Heart className="h-4 w-4" />, color: 'text-gray-500', activeColor: 'text-pink-400 bg-pink-500/10' },
  endorse: { type: 'endorse', label: 'Endorse', icon: <ThumbsUp className="h-4 w-4" />, color: 'text-gray-500', activeColor: 'text-emerald-400 bg-emerald-500/10' },
  oppose: { type: 'oppose', label: 'Oppose', icon: <ThumbsDown className="h-4 w-4" />, color: 'text-gray-500', activeColor: 'text-red-400 bg-red-500/10' },
  upvote: { type: 'upvote', label: 'Upvote', icon: <ArrowUp className="h-4 w-4" />, color: 'text-gray-500', activeColor: 'text-amber-400 bg-amber-500/10' },
  downvote: { type: 'downvote', label: 'Downvote', icon: <ArrowDown className="h-4 w-4" />, color: 'text-gray-500', activeColor: 'text-gray-400 bg-gray-500/10' },
};

interface UnifiedReactionBarProps {
  targetType: string;
  targetId: string;
  currentUser: { id: string } | null;
  allowedReactions?: string[];
}

export default function UnifiedReactionBar({ targetType, targetId, currentUser, allowedReactions = ['like', 'endorse', 'oppose'] }: UnifiedReactionBarProps) {
  const [reactions, setReactions] = useState<Record<string, { count: number; userReacted: boolean }>>({});
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);

  const fetchReactions = useCallback(async () => {
    try {
      const userParam = currentUser ? `&user_id=${currentUser.id}` : '';
      const res = await fetch(`/api/reactions?target_type=${targetType}&target_id=${targetId}${userParam}`);
      const data = await res.json();
      if (data.success) {
        setReactions(data.data);
      }
    } catch (err) {
      console.error('Fetch reactions error:', err);
    } finally {
      setLoading(false);
    }
  }, [targetType, targetId, currentUser]);

  useEffect(() => {
    fetchReactions();
  }, [fetchReactions]);

  async function toggleReaction(reactionType: string) {
    if (!currentUser) {
      alert('Please sign in to react');
      return;
    }

    setActing(reactionType);

    try {
      const current = reactions[reactionType];
      
      if (current?.userReacted) {
        // User already reacted — remove reaction
        // We need the reaction ID to delete it
        const res = await fetch(`/api/reactions?target_type=${targetType}&target_id=${targetId}&user_id=${currentUser.id}`);
        const data = await res.json();
        // Find the specific reaction to delete
        // For now, we don't have a direct way to get the reaction ID
        // This is a limitation of the current API design
        // In production, you'd want to store reaction IDs or use a different endpoint
      } else {
        // Add reaction
        const res = await fetch('/api/reactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            target_type: targetType,
            target_id: targetId,
            user_id: currentUser.id,
            reaction_type: reactionType,
          }),
        });

        if (res.ok || res.status === 409) {
          fetchReactions();
        }
      }
    } catch (err) {
      console.error('Reaction error:', err);
    } finally {
      setActing(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin text-[#536471]" />
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {allowedReactions.map((reactionType) => {
        const config = REACTION_CONFIGS[reactionType];
        if (!config) return null;

        const reaction = reactions[reactionType];
        const count = reaction?.count || 0;
        const userReacted = reaction?.userReacted || false;
        const isActing = acting === reactionType;

        return (
          <button
            key={reactionType}
            onClick={() => toggleReaction(reactionType)}
            disabled={isActing}
            className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-all ${
              userReacted
                ? `border-transparent ${config.activeColor}`
                : 'border-[#eff3f4] dark:border-gray-800 hover:bg-[#f7f9f9] dark:hover:bg-gray-800'
            }`}
          >
            {isActing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <span className={userReacted ? config.activeColor.split(' ')[0] : config.color}>
                {config.icon}
              </span>
            )}
            <span className={userReacted ? 'font-medium' : ''}>
              {count > 0 ? count : config.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
