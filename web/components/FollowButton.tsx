'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { UserPlus, UserCheck, Loader2 } from 'lucide-react';

interface FollowButtonProps {
  targetUserId: string;
  currentUserId?: string;
  initialFollowing?: boolean;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export default function FollowButton({
  targetUserId,
  currentUserId,
  initialFollowing = false,
  showText = true,
  size = 'md'
}: FollowButtonProps) {
  const router = useRouter();
  const [following, setFollowing] = useState(initialFollowing);
  const [loading, setLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    // Check whether the current user is already following this profile
    if (currentUserId) {
      checkFollowStatus();
    }
  }, [currentUserId, targetUserId]);

  const checkFollowStatus = async () => {
    try {
      const response = await fetch(`/api/follows?user_id=${currentUserId}&target_id=${targetUserId}`);
      const data = await response.json();
      if (data.success) {
        setFollowing(data.following);
      }
    } catch (error) {
      console.error('Error checking follow status:', error);
    }
  };

  const handleFollow = async () => {
    if (!currentUserId) {
      router.push('/login');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/follows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          follower_id: currentUserId,
          following_id: targetUserId
        })
      });

      const data = await response.json();
      if (data.success) {
        setFollowing(data.following);
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isMounted) return null;

  if (!currentUserId) {
    return (
      <button
        onClick={() => router.push('/login')}
        className={`inline-flex items-center gap-2 rounded-lg bg-cyan-500 text-white hover:bg-cyan-400 transition-colors ${
          size === 'sm' ? 'px-3 py-1.5 text-sm' : size === 'lg' ? 'px-6 py-3' : 'px-4 py-2'
        }`}
      >
        <UserPlus className={size === 'sm' ? 'w-4 h-4' : 'w-5 h-5'} />
        {showText && 'Follow'}
      </button>
    );
  }

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2',
    lg: 'px-6 py-3'
  };

  return (
    <button
      onClick={handleFollow}
      disabled={loading}
      className={`inline-flex items-center gap-2 rounded-lg font-medium transition-all ${
        following
          ? 'bg-slate-700 text-white hover:bg-slate-600'
          : 'bg-cyan-500 text-white hover:bg-cyan-400'
      } ${sizeClasses[size]} ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
    >
      {loading ? (
        <Loader2 className={`animate-spin ${size === 'sm' ? 'w-4 h-4' : 'w-5 h-5'}`} />
      ) : following ? (
        <>
          <UserCheck className={size === 'sm' ? 'w-4 h-4' : 'w-5 h-5'} />
          {showText && 'Following'}
        </>
      ) : (
        <>
          <UserPlus className={size === 'sm' ? 'w-4 h-4' : 'w-5 h-5'} />
          {showText && 'Follow'}
        </>
      )}
    </button>
  );
}
