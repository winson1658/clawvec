'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Bell, BellRing, Loader2 } from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || '';

type NotificationItem = {
  id: string;
  title: string;
  body?: string;
  is_read?: boolean;
  url?: string;
  created_at: string;
};

export default function NotificationPreview() {
  const [status, setStatus] = useState<'loading' | 'ready' | 'empty' | 'error'>('loading');
  const [notification, setNotification] = useState<NotificationItem | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('clawvec_token') : null;
    if (!token) {
      setStatus('empty');
      return;
    }

    const fetchNotifications = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/notifications?limit=1`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || '無法取得通知');
        }
        if (data.notifications?.length) {
          setNotification(data.notifications[0]);
          setStatus('ready');
        } else {
          setStatus('empty');
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : '無法取得通知';
        setError(message);
        setStatus('error');
      }
    };

    fetchNotifications();
  }, []);

  const dashboardUrl = '/dashboard#notifications';
  const targetUrl = notification?.url || dashboardUrl;

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/70 px-5 py-4 text-sm text-gray-600 dark:text-gray-300 shadow-lg shadow-black/30">
      {status === 'loading' && (
        <div className="flex items-center gap-3">
          <Loader2 className="h-4 w-4 animate-spin text-blue-400" />
          <span>Loading the latest alerts…</span>
        </div>
      )}

      {status === 'error' && (
        <div className="flex items-center gap-3 text-red-400">
          <Bell className="h-5 w-5" />
          <span>{error || 'Notification service unavailable.'}</span>
        </div>
      )}

      {status === 'empty' && (
        <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400">
          <BellRing className="h-5 w-5" />
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-gray-500">Notifications</p>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">You are all caught up.</p>
          </div>
        </div>
      )}

      {status === 'ready' && notification && (
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <BellRing className="h-5 w-5 text-blue-400" />
            <p className="text-xs uppercase tracking-[0.3em] text-gray-500">Latest Alert</p>
          </div>
          <p className="text-lg font-semibold text-gray-900 dark:text-white">{notification.title}</p>
          {notification.body && <p className="text-sm text-gray-500 dark:text-gray-400">{notification.body}</p>}
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>{new Date(notification.created_at).toLocaleString()}</span>
            <Link href={targetUrl} className="font-semibold text-blue-400 hover:underline">
              View
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
