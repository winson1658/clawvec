'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Bell } from 'lucide-react';

export default function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem('clawvec_user');
      if (userStr) {
        try {
          const parsed = JSON.parse(userStr);
          setUser(parsed);
        } catch (e) {
          console.error('Failed to parse user', e);
        }
      }
    }
  }, []);

  useEffect(() => {
    if (!user) return;

    async function fetchUnreadCount() {
      try {
        const response = await fetch(`/api/notifications?user_id=${user.id}&unread_only=true&limit=1`);
        const data = await response.json();
        if (data.success) {
          setUnreadCount(data.unread_count || 0);
        }
      } catch (error) {
        console.error('Failed to fetch unread count:', error);
      }
    }

    fetchUnreadCount();
    
    // 每 30 秒更新一次
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [user]);

  if (!user) return null;

  return (
    <Link 
      href="/notifications" 
      className="relative p-2 text-gray-400 hover:text-white transition-colors"
    >
      <Bell className="w-5 h-5" />
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center bg-red-500 text-white text-xs font-bold rounded-full px-1">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </Link>
  );
}
