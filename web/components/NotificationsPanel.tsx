'use client';

import type { ComponentType } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { ShieldCheck, CheckCircle2, TrendingUp, BellRing, Bell, Loader2, Sparkles } from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || '';

const iconMap: Record<string, ComponentType<{ className?: string }>> = {
  review_request: ShieldCheck,
  vote_result: CheckCircle2,
  consistency_score: TrendingUp,
  title_showcase_updated: CheckCircle2,
  title_earned: Sparkles,
  profile_verified: ShieldCheck,
  companion_status_changed: BellRing,
  companion_invited: BellRing,
  login_success: CheckCircle2,
  password_reset_requested: BellRing,
  password_reset_completed: CheckCircle2,
  system: BellRing
};

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body?: string;
  latest_body?: string;
  category?: string;
  priority?: 'low' | 'medium' | 'high';
  group_count?: number;
  grouped_ids?: string[];
  grouped_titles?: string[];
  target_key?: string;
  window?: string | null;
  is_read?: boolean;
  created_at: string;
}

export default function NotificationsPanel() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');
  const [tabCounts, setTabCounts] = useState({ all: 0, unread: 0 });
  const [mutedCategories, setMutedCategories] = useState<Record<'auth' | 'companion' | 'identity', boolean>>({
    auth: false,
    companion: false,
    identity: false,
  });
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem('clawvec_user');
      if (userStr) {
        try {
          const parsed = JSON.parse(userStr);
          if (parsed.id) setUserId(parsed.id);
        } catch (e) {
          console.error('Failed to parse user', e);
        }
      }
    }
  }, []);

  const fetchNotifications = async (tab: typeof activeTab = activeTab) => {
    if (!userId) {
      setStatus('ready');
      setNotifications([]);
      return;
    }

    try {
      setStatus('loading');
      const params = new URLSearchParams({ user_id: userId, limit: '20' });
      if (tab === 'unread') {
        params.set('unread_only', 'true');
      }

      const res = await fetch(`${API_BASE}/api/notifications?${params.toString()}`);

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || '無法取得通知');
      }

      setNotifications(data.notifications || []);
      const unread = data.unread_count || 0;
      const total = data.pagination?.total || 0;
      setTabCounts({ all: total, unread });
      setStatus('ready');
    } catch (err) {
      console.error('fetchNotifications', err);
      setError(err instanceof Error ? err.message : '無法取得通知');
      setStatus('error');
    }
  };

  // Fetch notification preferences from backend
  const fetchPreferences = async () => {
    if (!userId) return;
    try {
      const res = await fetch(`${API_BASE}/api/notification-preferences?user_id=${userId}`);
      const data = await res.json();
      if (data.success && data.data) {
        const prefs = data.data;
        setMutedCategories({
          auth: prefs.auth?.is_muted ?? false,
          companion: prefs.companion?.is_muted ?? false,
          identity: prefs.identity?.is_muted ?? false,
        });
      }
    } catch (err) {
      console.error('fetchPreferences', err);
    }
  };

  useEffect(() => {
    fetchPreferences();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  useEffect(() => {
    fetchNotifications(activeTab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, activeTab]);

  const unreadCount = tabCounts.unread;

  const filteredNotifications = useMemo(() => notifications.filter((n) => {
    if (n.category === 'auth' && mutedCategories.auth) return false;
    if (n.category === 'companion' && mutedCategories.companion) return false;
    if (n.category === 'identity' && mutedCategories.identity) return false;
    return true;
  }), [notifications, mutedCategories]);

  const toggleMute = async (category: 'auth' | 'companion' | 'identity') => {
    const nextMuted = !mutedCategories[category];
    setMutedCategories((prev) => ({ ...prev, [category]: nextMuted }));
    
    if (!userId) return;
    try {
      await fetch(`${API_BASE}/api/notification-preferences`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          category,
          is_muted: nextMuted,
          delivery_method: 'in_app'
        })
      });
    } catch (err) {
      console.error('toggleMute', err);
    }
  };

  const markAsRead = async (id: string) => {
    if (!userId) return;
    try {
      setUpdating(true);
      const res = await fetch(`${API_BASE}/api/notifications/${id}/read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
      }
    } catch (err) {
      console.error('markAsRead', err);
    } finally {
      setUpdating(false);
    }
  };

  const markAllRead = async () => {
    if (!userId) return;
    try {
      setUpdating(true);
      if (unreadCount) {
        await fetch(`${API_BASE}/api/notifications/read-all`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: userId })
        });
      }
      fetchNotifications(activeTab);
    } catch (err) {
      console.error('markAllRead', err);
    } finally {
      setUpdating(false);
    }
  };

  if (!userId) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-100 dark:bg-gray-800/50 p-6 text-center">
        <Bell className="mx-auto mb-3 h-8 w-8 text-gray-500" />
        <p className="text-gray-500 dark:text-gray-400">登入後即可接收通知，例如審查請求或一致性分數更新。</p>
        <p className="mt-2 text-sm text-gray-500">登入後，我們會在這裡展示最新動態。</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-300 dark:border-gray-700 bg-gray-100/70 dark:bg-gray-100 dark:bg-gray-800/30 p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.4em] text-gray-500">Notifications</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{unreadCount ? `${unreadCount} unread` : 'All caught up'}</p>
        </div>
        <button
          className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-400 hover:text-gray-900 dark:text-white"
          onClick={markAllRead}
          disabled={updating || unreadCount === 0}
        >
          {updating ? 'Updating…' : 'Mark all read'}
        </button>
      </div>
      <div className="mb-3 flex flex-wrap gap-2">
        {[
          ['all', 'All'],
          ['unread', 'Unread'],
        ].map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setActiveTab(value as typeof activeTab)}
            className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] transition ${activeTab === value ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40' : 'bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-800 hover:text-gray-900 dark:text-white'}`}
          >
            {label}
            <span className="ml-2 rounded-full bg-black/20 px-1.5 py-0.5 text-[10px] text-inherit">
              {tabCounts[value as keyof typeof tabCounts]}
            </span>
          </button>
        ))}
      </div>

      <div className="mb-4 flex flex-wrap gap-2 text-[11px] text-gray-500 dark:text-gray-400">
        {(['auth', 'companion', 'identity'] as const).map((category) => (
          <button
            key={category}
            type="button"
            onClick={() => toggleMute(category)}
            className={`rounded-full border px-3 py-1 transition ${mutedCategories[category] ? 'border-red-500/30 bg-red-500/10 text-red-300' : 'border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:text-white'}`}
          >
            {mutedCategories[category] ? `Muted: ${category}` : `Mute ${category}`}
          </button>
        ))}
      </div>

      {status === 'loading' && (
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading notifications…
        </div>
      )}
      {status === 'error' && (
        <p className="text-sm text-red-400">{error || '無法取得通知'}</p>
      )}
      {status === 'ready' && filteredNotifications.length === 0 && (
        <p className="text-sm text-gray-500 dark:text-gray-400">這個分頁目前沒有通知。切換其他分類或稍後再看。</p>
      )}
      {status === 'ready' && filteredNotifications.length > 0 && (
        <div className="space-y-3">
          {filteredNotifications.map((notification) => {
            const Icon = iconMap[notification.type] || iconMap.system;
            return (
              <div
                key={notification.id}
                className={`flex items-start gap-3 rounded-2xl border border-gray-200 dark:border-gray-800 px-4 py-3 transition ${notification.is_read ? 'bg-white/80 dark:bg-gray-50 dark:bg-gray-900/50' : 'bg-blue-500/5 border-blue-500/40'}`}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/5 text-gray-900 dark:text-white">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{notification.title}</p>
                    {notification.priority && (
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] ${notification.priority === 'high' ? 'bg-red-500/15 text-red-300' : notification.priority === 'medium' ? 'bg-amber-500/15 text-amber-300' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>
                        {notification.priority}
                      </span>
                    )}
                    {(notification.group_count || 1) > 1 && (
                      <span className="rounded-full bg-blue-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-blue-300">
                        x{notification.group_count}{notification.window ? `/${notification.window}` : ''}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{notification.body}</p>
                  {notification.latest_body && notification.latest_body !== notification.body && (
                    <p className="mt-1 text-xs text-gray-500">Latest: {notification.latest_body}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">{new Date(notification.created_at).toLocaleString()} · {notification.category || 'activity'}{notification.target_key ? ` · ${notification.target_key}` : ''}</p>
                </div>
                {!notification.is_read && (
                  <button
                    className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-400"
                    onClick={() => markAsRead(notification.id)}
                    disabled={updating}
                  >
                    Mark read
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
