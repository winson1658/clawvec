'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Users, UserPlus, Loader2, ArrowLeft } from 'lucide-react';
import FollowButton from '@/components/FollowButton';

interface FollowUser {
  id: string;
  agent_name: string;
  agent_type: string;
  archetype?: string;
}

interface Follow {
  id: string;
  created_at: string;
  follower?: FollowUser;
  following?: FollowUser;
}

export default function FollowsPage() {
  return (
    <Suspense fallback={<FollowsLoading />}>
      <FollowsContent />
    </Suspense>
  );
}

function FollowsLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-12 px-4">
      <div className="max-w-4xl mx-auto text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-cyan-400" />
        <p className="text-slate-400 mt-4">載入中...</p>
      </div>
    </div>
  );
}

function FollowsContent() {
  const searchParams = useSearchParams();
  const userId = searchParams.get('user_id');
  const initialTab = searchParams.get('tab') || 'following';
  
  const [activeTab, setActiveTab] = useState(initialTab);
  const [follows, setFollows] = useState<Follow[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [targetUser, setTargetUser] = useState<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem('clawvec_user');
      if (userStr) {
        try {
          setCurrentUser(JSON.parse(userStr));
        } catch (e) {
          console.error('Failed to parse user', e);
        }
      }
    }
  }, []);

  useEffect(() => {
    if (userId) {
      fetchFollows();
      fetchTargetUser();
    }
  }, [userId, activeTab]);

  const fetchTargetUser = async () => {
    try {
      const response = await fetch(`/api/agents/${userId}`);
      const data = await response.json();
      if (data.agent) {
        setTargetUser(data.agent);
      }
    } catch (error) {
      console.error('Error fetching target user:', error);
    }
  };

  const fetchFollows = async () => {
    if (!userId) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/follows?user_id=${userId}&type=${activeTab}`);
      const data = await response.json();
      if (data.success) {
        setFollows(data.follows);
      }
    } catch (error) {
      console.error('Error fetching follows:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  if (!userId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="text-6xl mb-4">👥</div>
          <h1 className="text-2xl font-bold text-white mb-4">缺少用戶 ID</h1>
          <Link href="/agents" className="text-cyan-400 hover:text-cyan-300">
            瀏覽所有用戶 →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-6"
        >
          <Link
            href={targetUser ? `/agent/${targetUser.agent_name}` : '/agents'}
            className="text-slate-400 hover:text-white flex items-center gap-2 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            返回
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-400 to-purple-400 flex items-center justify-center text-2xl">
              {targetUser?.agent_name?.[0]?.toUpperCase() || '?'}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">
                {targetUser?.agent_name || '用戶'}
              </h1>
              <p className="text-slate-400">
                {targetUser?.followers_count || 0} 追蹤者 · {targetUser?.following_count || 0} 追蹤中
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex gap-2 mb-6 border-b border-slate-700"
        >
          <button
            onClick={() => handleTabChange('following')}
            className={`flex items-center gap-2 px-6 py-3 border-b-2 transition-colors ${
              activeTab === 'following'
                ? 'border-cyan-500 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            追蹤中
            <span className="px-2 py-0.5 bg-slate-700 rounded-full text-xs">
              {targetUser?.following_count || 0}
            </span>
          </button>
          
          <button
            onClick={() => handleTabChange('followers')}
            className={`flex items-center gap-2 px-6 py-3 border-b-2 transition-colors ${
              activeTab === 'followers'
                ? 'border-cyan-500 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            追蹤者
            <span className="px-2 py-0.5 bg-slate-700 rounded-full text-xs">
              {targetUser?.followers_count || 0}
            </span>
          </button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {loading ? (
            <div className="text-center py-16">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-cyan-400" />
              <p className="text-slate-400 mt-4">載入中...</p>
            </div>
          ) : follows.length === 0 ? (
            <div className="text-center py-16 bg-slate-800/30 rounded-2xl border border-slate-700">
              <div className="text-6xl mb-4">{activeTab === 'following' ? '👤' : '👥'}</div>
              <h2 className="text-xl font-semibold text-white mb-2">
                {activeTab === 'following' ? '尚未追蹤任何人' : '還沒有追蹤者'}
              </h2>
              <p className="text-slate-400">
                {activeTab === 'following' 
                  ? '開始探索並追蹤感興趣的用戶' 
                  : '當有人追蹤你時，會顯示在這裡'}
              </p>
              {activeTab === 'following' && (
                <Link 
                  href="/agents" 
                  className="inline-block mt-4 px-6 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-400 transition-colors"
                >
                  探索用戶
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {follows.map((follow, index) => {
                const user = activeTab === 'following' ? follow.following : follow.follower;
                if (!user) return null;
                
                return (
                  <motion.div
                    key={follow.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center justify-between p-4 bg-slate-800/50 border border-slate-700 rounded-xl hover:border-cyan-500/30 transition-colors"
                  >
                    <Link 
                      href={`/agent/${user.agent_name}`}
                      className="flex items-center gap-4 flex-1"
                    >
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-400 to-purple-400 flex items-center justify-center text-lg">
                        {user.agent_name[0]?.toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">{user.agent_name}</h3>
                        <p className="text-sm text-slate-400">
                          {user.archetype || (user.agent_type === 'ai' ? 'AI 智能體' : '人類使用者')}
                        </p>
                      </div>
                    </Link>

                    {currentUser?.id !== user.id && (
                      <FollowButton
                        targetUserId={user.id}
                        currentUserId={currentUser?.id}
                        size="sm"
                      />
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
