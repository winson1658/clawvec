'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, 
  MessageSquare, 
  Heart, 
  UserPlus, 
  AtSign, 
  Info,
  Check,
  Trash2,
  Loader2
} from 'lucide-react';

interface Notification {
  id: string;
  type: 'reply' | 'like' | 'follow' | 'mention' | 'system' | 'debate' | 'vote_result';
  title: string;
  message: string;
  payload: any;
  link?: string;
  is_read: boolean;
  created_at: string;
}

const typeIcons: Record<string, any> = {
  reply: MessageSquare,
  like: Heart,
  follow: UserPlus,
  mention: AtSign,
  system: Info,
  debate: MessageSquare,
  vote_result: Info
};

const typeColors: Record<string, string> = {
  reply: 'bg-blue-500/20 text-blue-400',
  like: 'bg-pink-500/20 text-pink-400',
  follow: 'bg-green-500/20 text-green-400',
  mention: 'bg-yellow-500/20 text-yellow-400',
  system: 'bg-gray-500/20 text-gray-400',
  debate: 'bg-purple-500/20 text-purple-400',
  vote_result: 'bg-cyan-500/20 text-cyan-400'
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem('clawvec_user');
      if (userStr) {
        try {
          setUser(JSON.parse(userStr));
        } catch (e) {
          console.error('Failed to parse user', e);
        }
      }
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  async function fetchNotifications() {
    if (!user) return;
    
    try {
      const response = await fetch(`/api/notifications?user_id=${user.id}&limit=50`);
      const data = await response.json();
      
      if (data.success) {
        setNotifications(data.notifications || []);
        setUnreadCount(data.unread_count || 0);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  }

  async function markAsRead(id: string) {
    if (!user) return;

    try {
      const response = await fetch(`/api/notifications/${id}/read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id })
      });

      if (response.ok) {
        setNotifications(prev => 
          prev.map(n => n.id === id ? { ...n, is_read: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  }

  async function markAllAsRead() {
    if (!user) return;
    
    setMarkingAll(true);
    try {
      const response = await fetch('/api/notifications/read-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id })
      });

      if (response.ok) {
        setNotifications(prev => 
          prev.map(n => ({ ...n, is_read: true }))
        );
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    } finally {
      setMarkingAll(false);
    }
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} minutes ago`;
    if (hours < 24) return `${hours} hours ago`;
    if (days < 7) return `${days} days ago`;
    
    return date.toLocaleDateString('zh-TW');
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="text-6xl mb-4">🔔</div>
          <h1 className="text-2xl font-bold text-white mb-4">Please Sign In</h1>
          <p className="text-slate-400 mb-6">Sign in to view your notifications</p>
          <Link 
            href="/login"
            className="inline-flex items-center gap-2 px-6 py-3 bg-cyan-500 hover:bg-cyan-400 text-white rounded-lg transition-colors"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Bell className="w-8 h-8 text-cyan-400" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">Notifications</h1>
                <p className="text-slate-400">
                  {unreadCount > 0 ? `You have ${unreadCount} unread notifications` : 'All notifications read'}
                </p>
              </div>
            </div>
            
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                disabled={markingAll}
                className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                {markingAll ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                Mark All as Read
              </button>
            )}
          </div>
        </motion.div>

        {/* Notifications List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-4"
        >
          {loading ? (
            <div className="text-center py-12">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-cyan-400" />
              <p className="text-slate-400 mt-4">Loading...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-12 bg-slate-800/50 rounded-2xl border border-slate-700">
              <div className="text-6xl mb-4">📭</div>
              <h2 className="text-xl font-semibold text-white mb-2">No Notifications</h2>
              <p className="text-slate-400">When there are important updates, you will see them here</p>
            </div>
          ) : (
            <AnimatePresence>
              {notifications.map((notification, index) => {
                const Icon = typeIcons[notification.type] || Info;
                const colorClass = typeColors[notification.type] || typeColors.system;
                
                return (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.05 }}
                    className={`p-4 rounded-xl border transition-all ${
                      notification.is_read 
                        ? 'bg-slate-800/30 border-slate-700 opacity-70' 
                        : 'bg-slate-800/70 border-cyan-500/30'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      {/* Icon */}
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h3 className="font-semibold text-white">
                              {notification.title}
                            </h3>
                            <p className="text-slate-400 text-sm mt-1">
                              {notification.message}
                            </p>
                            <p className="text-slate-500 text-xs mt-2">
                              {formatDate(notification.created_at)}
                            </p>
                          </div>
                          
                          {/* Actions */}
                          <div className="flex items-center gap-2">
                            {!notification.is_read && (
                              <button
                                onClick={() => markAsRead(notification.id)}
                                className="p-2 text-cyan-400 hover:bg-cyan-500/20 rounded-lg transition-colors"
                                title="Mark as Read"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                            )}
                            {notification.link && (
                              <Link
                                href={notification.link}
                                className="px-3 py-1 bg-cyan-500/20 text-cyan-400 text-sm rounded-lg hover:bg-cyan-500/30 transition-colors"
                              >
                                View
                              </Link>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </motion.div>
      </div>
    </div>
  );
}
