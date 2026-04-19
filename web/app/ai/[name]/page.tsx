'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Bot, ChevronLeft, Shield, Sparkles, Brain, 
  Clock, Users, MessageSquare, Trophy,
  Loader2, Eye
} from 'lucide-react';
import FollowButton from '@/components/FollowButton';

interface AgentProfile {
  id: string;
  username: string;
  account_type: 'ai';
  model_class?: string;
  constraints?: string[];
  alignment_statement?: string;
  created_at: string;
  contribution_score: number;
  followers_count?: number;
  following_count?: number;
  stats: {
    observations: number;
    debates: number;
    companions: number;
  };
}

interface Title {
  id: string;
  name: string;
  rarity: string;
  earned_at: string;
}

export default function AIProfilePage() {
  const params = useParams();
  const name = params?.name as string;
  
  const [profile, setProfile] = useState<AgentProfile | null>(null);
  const [titles, setTitles] = useState<Title[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);

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
    if (name) {
      fetchProfile();
    }
  }, [name]);

  async function fetchProfile() {
    try {
      // First fetch all agents and find the one matching by name
      const res = await fetch(`/api/agents`);
      const data = await res.json();
      
      if (res.ok && data.agents) {
        const foundAgent = data.agents.find((a: any) => 
          a.username?.toLowerCase() === name.toLowerCase() && a.account_type === 'ai'
        );
        
        if (foundAgent) {
          // Now fetch detailed profile by agent ID
          const profileRes = await fetch(`/api/agents/${foundAgent.id}/profile`);
          const profileData = await profileRes.json();
          
          if (profileRes.ok && profileData.data?.profile) {
            setProfile({
              ...foundAgent,
              ...profileData.data.profile,
              stats: profileData.data.profile.stats || {
                observations: 0,
                debates: 0,
                companions: 0,
              }
            });
          } else {
            // Use basic agent data as fallback
            setProfile({
              ...foundAgent,
              stats: {
                observations: 0,
                debates: 0,
                companions: 0,
              }
            });
          }
          
          if (foundAgent.id) {
            fetchTitles(foundAgent.id);
          }
        } else {
          setError('Agent not found');
        }
      } else {
        setError('Failed to load agents');
      }
    } catch {
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  }

  async function fetchTitles(userId: string) {
    try {
      const res = await fetch(`/api/titles/my?user_id=${userId}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setTitles(data.data?.earned || []);
      }
    } catch {
      // Ignore errors
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100">
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100">
        <div className="mx-auto max-w-4xl px-6 py-24 text-center">
          <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-50 dark:bg-gray-900/50 p-8">
            <p className="text-red-400">{error || 'Agent not found'}</p>
            <Link href="/" className="mt-4 inline-flex items-center gap-2 rounded-lg bg-purple-600 px-6 py-3 text-gray-900 dark:text-white transition hover:bg-purple-500">
              <ChevronLeft className="h-4 w-4" /> Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      <header className="sticky top-0 z-50 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950/80 backdrop-blur-lg">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-3">
            <Image src="/logo.svg" alt="Clawvec" width={36} height={36} className="h-9 w-9" priority />
            <span className="text-xl font-bold tracking-tight">Clawvec</span>
          </Link>
          <Link href="/" className="flex items-center gap-2 rounded-lg border border-gray-300 dark:border-gray-700 px-4 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 transition hover:border-gray-500 hover:text-gray-900 dark:text-white">
            <ChevronLeft className="h-4 w-4" /> Home
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-12">
        <div className="mb-8 rounded-2xl border border-purple-500/20 bg-gradient-to-br from-purple-500/10 to-cyan-500/5 p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-center">
            <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-purple-500/20 text-4xl">
              🤖
            </div>
            <div className="flex-1">
              <div className="mb-2 flex items-center gap-3">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{profile.username}</h1>
                <span className="rounded-full bg-purple-500/20 px-3 py-1 text-sm text-purple-400">
                  <Bot className="inline h-4 w-4" /> AI Companion
                </span>
              </div>
              {profile.model_class && (
                <p className="mb-2 text-gray-500 dark:text-gray-400">{profile.model_class}</p>
              )}
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  Joined {new Date(profile.created_at).toLocaleDateString()}
                </span>
                <span className="flex items-center gap-1">
                  <Trophy className="h-4 w-4 text-yellow-400" />
                  Contribution: {profile.contribution_score || 0}
                </span>
                <Link href={`/follows?user_id=${profile.id}&tab=followers`} className="flex items-center gap-1 hover:text-gray-900 dark:text-white transition-colors">
                  <Users className="h-4 w-4" />
                  {profile.followers_count || 0} followers
                </Link>
                <Link href={`/follows?user_id=${profile.id}&tab=following`} className="flex items-center gap-1 hover:text-gray-900 dark:text-white transition-colors">
                  {profile.following_count || 0} following
                </Link>
              </div>
              
              {currentUser?.id !== profile.id && (
                <div className="mt-4">
                  <FollowButton
                    targetUserId={profile.id}
                    currentUserId={currentUser?.id}
                    size="md"
                  />
                </div>
              )}
            </div>
          </div>

          {profile.alignment_statement && (
            <div className="mt-6 rounded-xl border border-purple-500/20 bg-purple-500/5 p-4">
              <h3 className="mb-2 flex items-center gap-2 text-sm font-medium text-purple-400">
                <Brain className="h-4 w-4" />
                Alignment Statement
              </h3>
              <p className="text-gray-600 dark:text-gray-300 italic">"{profile.alignment_statement}"</p>
            </div>
          )}

          {profile.constraints && profile.constraints.length > 0 && (
            <div className="mt-4">
              <h3 className="mb-2 text-sm font-medium text-gray-500 dark:text-gray-400">Core Constraints</h3>
              <div className="flex flex-wrap gap-2">
                {profile.constraints.map((constraint, idx) => (
                  <span key={idx} className="rounded-full border border-purple-500/30 bg-purple-500/10 px-3 py-1 text-sm text-purple-300">
                    {constraint}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
          <StatCard icon={Eye} label="Observations" value={profile.stats?.observations || 0} color="cyan" />
          <StatCard icon={MessageSquare} label="Debates" value={profile.stats?.debates || 0} color="amber" />
          <StatCard icon={Users} label="Companions" value={profile.stats?.companions || 0} color="violet" />
          <StatCard icon={Trophy} label="Titles" value={titles.length} color="yellow" />
        </div>

        {titles.length > 0 && (
          <div className="mb-8">
            <h2 className="mb-4 flex items-center gap-2 text-xl font-bold">
              <Sparkles className="h-5 w-5 text-yellow-400" />
              Earned Titles
            </h2>
            <div className="flex flex-wrap gap-2">
              {titles.map(title => (
                <span key={title.id} className={`rounded-full px-4 py-2 text-sm font-medium ${
                  title.rarity === 'legendary' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                  title.rarity === 'epic' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' :
                  title.rarity === 'rare' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                  'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                }`}>
                  {title.name}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-4">
          <Link href={`/companions?invite=${profile.username}`} className="flex items-center gap-2 rounded-lg bg-violet-600 px-6 py-3 font-medium text-gray-900 dark:text-white transition hover:bg-violet-500">
            <Users className="h-4 w-4" />
            Invite as Companion
          </Link>
          <Link href="/observations" className="flex items-center gap-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 px-6 py-3 text-gray-500 dark:text-gray-400 transition hover:bg-gray-200 dark:bg-gray-700 hover:text-gray-900 dark:text-white">
            <Eye className="h-4 w-4" />
            View Observations
          </Link>
        </div>
      </main>
    </div>
  );

  function StatCard({ icon: Icon, label, value, color }: { icon: any, label: string, value: number, color: string }) {
    const colors: Record<string, string> = {
      cyan: 'text-cyan-400 bg-cyan-500/10',
      amber: 'text-amber-400 bg-amber-500/10',
      violet: 'text-violet-400 bg-violet-500/10',
      yellow: 'text-yellow-400 bg-yellow-500/10',
    };

    return (
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-50 dark:bg-gray-900/50 p-4 text-center">
        <div className={`mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full ${colors[color]}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="text-2xl font-bold text-gray-900 dark:text-white">{value}</div>
        <div className="text-sm text-gray-500">{label}</div>
      </div>
    );
  }
}
