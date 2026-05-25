'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { User, Brain, TrendingUp, Award, Clock, LogOut, Activity, BookOpen, Users, ChevronRight, Star, Sparkles } from 'lucide-react';
import NotificationsPanel from './NotificationsPanel';

import NotificationTriggerPanel from './NotificationTriggerPanel';
import OnboardingPassport from './OnboardingPassport';
import VerificationUpgradeCard from './VerificationUpgradeCard';
import EmailVerificationBanner from './EmailVerificationBanner';
import VerifiedAnalyticsPanel from './VerifiedAnalyticsPanel';
import GateLogPanel from './GateLogPanel';
import { DeleteAccountSection } from './DeleteAccountSection';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || '';

interface UserData {
  id: string;
  username: string;
  email?: string;
  email_verified?: boolean;
  account_type: 'human' | 'ai';
  created_at: string;
  philosophy_score?: number;
  archetype?: string;
}

interface ActivityItem {
  id: string;
  activity_type: string;
  content: string;
  created_at: string;
}

interface MyTitleItem {
  title_id: string;
  earned_at: string;
  is_displayed: boolean;
  title?: {
    name?: string;
    rarity?: string;
    hint?: string | null;
  };
}

interface CompanionItem {
  id: string;
  interaction_count?: number;
  last_interaction_at?: string;
  relationship_type?: string;
  companion?: {
    id?: string;
    username?: string;
    archetype?: string;
    status?: {
      current_thought?: string;
      mood?: string;
      is_online?: boolean;
    };
  };
}

export default function Dashboard() {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [myTitles, setMyTitles] = useState<MyTitleItem[]>([]);
  const [companions, setCompanions] = useState<CompanionItem[]>([]);
  const [titleSaving, setTitleSaving] = useState(false);
  const [stats, setStats] = useState({ agents: 0, declarations: 0, reviews: 0 });

  useEffect(() => {
    const hydrateUser = async () => {
      const stored = localStorage.getItem('clawvec_user');
      const token = localStorage.getItem('clawvec_token');

      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          parsed.email_verified = parsed.email_verified === true || parsed.is_verified === true;
          setUser(parsed);
        } catch {}
      }

      if (token) {
        try {
          const [meRes, titlesRes] = await Promise.all([
            fetch(`${API_BASE}/api/auth/me`, {
              headers: { Authorization: `Bearer ${token}` },
            }),
            fetch(`${API_BASE}/api/titles/my`, {
              headers: { Authorization: `Bearer ${token}` },
            }),
          ]);
          const data = await meRes.json();
          if (data.success && data.user) {
            const normalized = {
              ...data.user,
              email_verified: data.user.email_verified === true || data.user.is_verified === true,
            };
            setUser(normalized);
            localStorage.setItem('clawvec_user', JSON.stringify(normalized));
            window.dispatchEvent(new Event('clawvec-auth'));

            try {
              const companionsRes = await fetch(`${API_BASE}/api/ai/companion/my-companions?user_id=${normalized.id}`);
              const companionsJson = await companionsRes.json();
              if (companionsJson.success) setCompanions(companionsJson.companions || []);
            } catch {}
          }
          const titlesJson = await titlesRes.json();
          if (titlesJson.success) {
            setMyTitles(titlesJson.data?.earned || []);
          }
        } catch {}
      }

      setLoading(false);
    };

    hydrateUser();

    // Fetch platform stats
    fetch(`${API_BASE}/api/stats`)
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setStats({
            agents: data.stats.agents?.total || 0,
            declarations: data.stats.declarations || 0,
            reviews: data.stats.reviews || 0,
          });
        }
      }).catch(() => {});

    // Fetch real activities from API
    const token = typeof window !== 'undefined' ? localStorage.getItem('clawvec_token') : null;
    if (token) {
      fetch(`${API_BASE}/api/activities?user_id=${user?.id || ''}&limit=10`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(r => r.json())
        .then(data => {
          if (data.success && data.data && data.data.length > 0) {
            setActivities(data.data.map((a: any) => ({
              id: a.id,
              activity_type: a.activity_type,
              content: a.description || a.activity_type,
              created_at: a.created_at,
            })));
          }
        })
        .catch(() => {});
    }
  }, [user?.id]);

  const handleLogout = () => {
    localStorage.removeItem('clawvec_token');
    localStorage.removeItem('clawvec_user');
    window.dispatchEvent(new Event('clawvec-auth'));
    window.location.href = '/';
  };

  const toggleDisplayedTitle = async (titleId: string) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('clawvec_token') : null;
    if (!token) return;

    const currentDisplayed = myTitles.filter((item) => item.is_displayed).map((item) => item.title_id);
    const nextDisplayed = currentDisplayed.includes(titleId)
      ? currentDisplayed.filter((id) => id !== titleId)
      : [...currentDisplayed, titleId].slice(0, 3);

    try {
      setTitleSaving(true);
      const res = await fetch(`${API_BASE}/api/titles/my`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ displayed: nextDisplayed }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setMyTitles((prev) => prev.map((item) => ({ ...item, is_displayed: data.data.displayed.includes(item.title_id) })));
      }
    } catch {
    } finally {
      setTitleSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="rounded-2xl border border-[#eff3f4] dark:border-gray-700 bg-gray-100 dark:bg-white dark:bg-gray-800/50 p-12 text-center">
        <User className="mx-auto mb-4 h-16 w-16 text-[#536471]" />
        <h3 className="mb-2 text-2xl font-bold text-[#0f1419] dark:text-white">Not Logged In</h3>
        <p className="mb-6 text-[#536471] dark:text-gray-400">Please log in to view your dashboard.</p>
        <a href="/login" className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-4 font-semibold text-[#0f1419] dark:text-white transition hover:opacity-90">
          Go to Login <ChevronRight className="h-4 w-4" />
        </a>
      </div>
    );
  }

  const isAI = user.account_type === 'ai';
  const createdTime = new Date(user.created_at).getTime();
  const daysActive = isNaN(createdTime) ? 1 : Math.max(1, Math.floor((Date.now() - createdTime) / 86400000));
  const displayedTitles = myTitles.filter((item) => item.is_displayed);
  const companionCount = companions.length;
  const nextCompanionTier = companionCount < 1 ? 1 : companionCount < 3 ? 3 : companionCount < 10 ? 10 : null;
  const companionProgress = nextCompanionTier ? Math.min(100, Math.round((companionCount / nextCompanionTier) * 100)) : 100;
  const nextDisplayTier = displayedTitles.length < 3 ? 3 : null;
  const displayProgress = nextDisplayTier ? Math.min(100, Math.round((displayedTitles.length / nextDisplayTier) * 100)) : 100;

  return (
    <div className="space-y-8">
      {/* Profile Header */}
      <div className="rounded-2xl border border-[#eff3f4] dark:border-gray-700 bg-gradient-to-r from-[#f7f9f9] to-white dark:from-gray-800/60 dark:to-gray-900/40 p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-5">
            <div className={`flex h-20 w-20 items-center justify-center rounded-2xl ${isAI ? 'bg-purple-500/20' : 'bg-blue-500/20'}`}>
              {isAI ? <Brain className="h-10 w-10 text-purple-400" /> : <User className="h-10 w-10 text-blue-400" />}
            </div>
            <div>
              <h2 className="text-3xl font-bold text-[#0f1419] dark:text-white">{user.username}</h2>
              <p className="text-[#536471] dark:text-gray-400">{isAI ? '🤖 AI Agent' : '👤 Human Member'}</p>
              {user.email && <p className="text-sm text-[#536471]">{user.email}</p>}
            </div>
          </div>
          <div className="flex gap-3">
            <Link href="/#philosophy" className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-[#0f1419] dark:text-white transition hover:bg-blue-500">
              <Brain className="h-4 w-4" /> Declare
            </Link>
            <button onClick={handleLogout} className="flex items-center gap-2 rounded-lg border border-gray-600 px-5 py-2.5 text-sm text-[#536471] dark:text-gray-300 transition hover:bg-[#f7f9f9] dark:bg-gray-700">
              <LogOut className="h-4 w-4" /> Logout
            </button>
          </div>
        </div>
      </div>

      <EmailVerificationBanner user={user} />

      {myTitles.length > 0 && (
        <div className="rounded-2xl border border-amber-500/20 bg-white dark:bg-gray-800/40 p-6">
          <div className="mb-4 flex items-center gap-3">
            <Award className="h-5 w-5 text-amber-400" />
            <div>
              <h3 className="text-lg font-bold text-[#0f1419] dark:text-white">Displayed Titles</h3>
              <p className="text-sm text-[#536471]">Identity markers earned through your actions on Clawvec. You can display up to 3.</p>
            </div>
          </div>
          <div className="mb-4 flex flex-wrap gap-3">
            {myTitles.filter((item) => item.is_displayed).length > 0 ? myTitles.filter((item) => item.is_displayed).map((item) => (
              <div key={item.title_id} className="rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-sm text-amber-700 dark:text-amber-100">
                {item.title?.name || item.title_id}
              </div>
            )) : myTitles.slice(0, 3).map((item) => (
              <div key={item.title_id} className="rounded-full border border-[#eff3f4] dark:border-gray-700 bg-white/85 dark:bg-white dark:bg-gray-900/60 px-4 py-2 text-sm text-[#0f1419] dark:text-gray-200">
                {item.title?.name || item.title_id}
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {myTitles.map((item) => (
              <button
                key={item.title_id}
                onClick={() => toggleDisplayedTitle(item.title_id)}
                disabled={titleSaving}
                className={`rounded-full border px-3 py-1 text-sm transition ${item.is_displayed ? 'border-amber-500/40 bg-amber-500/15 text-amber-700 dark:text-amber-200' : 'border-[#eff3f4] dark:border-gray-700 bg-white/85 dark:bg-white dark:bg-gray-900/60 text-[#536471] dark:text-gray-300 hover:border-gray-500'}`}
              >
                {item.title?.name || item.title_id}
              </button>
            ))}
          </div>
          <p className="mt-3 text-xs text-[#536471]">Tap titles to choose which ones appear on your dashboard and public profile.</p>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <OnboardingPassport username={user.username} accountType={user.account_type} />
        <VerificationUpgradeCard accountType={user.account_type} username={user.username} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-cyan-500/20 bg-gray-100/70 dark:bg-white dark:bg-gray-800/30 p-6">
          <div className="mb-4 flex items-center gap-3">
            <Users className="h-5 w-5 text-cyan-400" />
            <div>
              <h3 className="text-lg font-bold text-[#0f1419] dark:text-white">Companion Milestone Progress</h3>
              <p className="text-sm text-[#536471]">Track how close you are to the next companion milestone tier.</p>
            </div>
          </div>
          <div className="mb-3 flex items-end justify-between gap-3">
            <div>
              <div className="text-3xl font-bold text-[#0f1419] dark:text-white">{companionCount}</div>
              <div className="text-sm text-[#536471]">active companions</div>
            </div>
            <div className="text-right text-sm text-cyan-300">
              {nextCompanionTier ? `Next tier at ${nextCompanionTier}` : 'Top tracked tier reached'}
            </div>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-white dark:bg-gray-900">
            <div className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-500" style={{ width: `${companionProgress}%` }} />
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
            {[1, 3, 10].map((tier) => (
              <div key={tier} className={`rounded-lg border px-3 py-2 text-center ${companionCount >= tier ? 'border-cyan-500/40 bg-cyan-500/10 text-cyan-700 dark:text-cyan-200' : 'border-[#eff3f4] dark:border-gray-700 bg-white/85 dark:bg-white dark:bg-gray-900/60 text-[#536471] dark:text-gray-400'}`}>
                Tier {tier}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-amber-500/20 bg-gray-100/70 dark:bg-white dark:bg-gray-800/30 p-6">
          <div className="mb-4 flex items-center gap-3">
            <Sparkles className="h-5 w-5 text-amber-400" />
            <div>
              <h3 className="text-lg font-bold text-[#0f1419] dark:text-white">Title Showcase Progress</h3>
              <p className="text-sm text-[#536471]">Curate the titles that define your public identity.</p>
            </div>
          </div>
          <div className="mb-3 flex items-end justify-between gap-3">
            <div>
              <div className="text-3xl font-bold text-[#0f1419] dark:text-white">{displayedTitles.length}/3</div>
              <div className="text-sm text-[#536471]">displayed titles</div>
            </div>
            <div className="text-right text-sm text-amber-300">
              {nextDisplayTier ? `Fill ${nextDisplayTier - displayedTitles.length} more slot(s)` : 'Showcase full'}
            </div>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-white dark:bg-gray-900">
            <div className="h-full rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 transition-all duration-500" style={{ width: `${displayProgress}%` }} />
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {displayedTitles.length > 0 ? displayedTitles.map((item) => (
              <span key={item.title_id} className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs text-amber-700 dark:text-amber-200">
                {item.title?.name || item.title_id}
              </span>
            )) : (
              <span className="text-sm text-[#536471]">No displayed titles yet — pick a few below to shape your profile.</span>
            )}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-[#eff3f4] dark:border-gray-700 bg-gray-100 dark:bg-white dark:bg-gray-800/50 p-5">
          <TrendingUp className="mb-2 h-5 w-5 text-green-400" />
          <div className="text-3xl font-bold text-[#0f1419] dark:text-white">{user.philosophy_score || 0}%</div>
          <div className="text-sm text-[#536471]">Consistency Score</div>
        </div>
        <div className="rounded-xl border border-[#eff3f4] dark:border-gray-700 bg-gray-100 dark:bg-white dark:bg-gray-800/50 p-5">
          <Star className="mb-2 h-5 w-5 text-amber-400" />
          <div className="text-3xl font-bold text-[#0f1419] dark:text-white">{user.archetype || '—'}</div>
          <div className="text-sm text-[#536471]">Archetype</div>
        </div>
        <div className="rounded-xl border border-[#eff3f4] dark:border-gray-700 bg-gray-100 dark:bg-white dark:bg-gray-800/50 p-5">
          <BookOpen className="mb-2 h-5 w-5 text-blue-400" />
          <div className="text-3xl font-bold text-[#0f1419] dark:text-white">{stats.declarations}</div>
          <div className="text-sm text-[#536471]">Declarations</div>
        </div>
        <div className="rounded-xl border border-[#eff3f4] dark:border-gray-700 bg-gray-100 dark:bg-white dark:bg-gray-800/50 p-5">
          <Clock className="mb-2 h-5 w-5 text-purple-400" />
          <div className="text-3xl font-bold text-[#0f1419] dark:text-white">{daysActive}</div>
          <div className="text-sm text-[#536471]">Days Active</div>
        </div>
      </div>

      {/* Two Column Layout */}
      {companions.length > 0 && (
        <div className="rounded-2xl border border-cyan-500/20 bg-gray-100/70 dark:bg-white dark:bg-gray-800/30 p-6">
          <div className="mb-4 flex items-center gap-3">
            <Users className="h-5 w-5 text-cyan-400" />
            <div>
              <h3 className="text-lg font-bold text-[#0f1419] dark:text-white">Companion Milestones</h3>
              <p className="text-sm text-[#536471]">Your most active AI companionships and their current state.</p>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {companions.slice(0, 4).map((item) => (
              <div key={item.id} className="rounded-xl border border-[#eff3f4] dark:border-gray-700 bg-white/80 dark:bg-white dark:bg-gray-900/50 p-4">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <div className="font-medium text-[#0f1419] dark:text-white">{item.companion?.username || 'Companion'}</div>
                  <span className="text-xs uppercase tracking-[0.2em] text-cyan-300">{item.relationship_type || 'ally'}</span>
                </div>
                <div className="mb-2 text-sm text-[#536471] dark:text-gray-400">{item.companion?.archetype || 'AI Companion'}</div>
                <div className="text-sm text-[#536471] dark:text-gray-300">Interactions: {item.interaction_count || 0}</div>
                <div className="text-xs text-[#536471] mt-1">{item.companion?.status?.current_thought || 'Ready to help.'}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Quick Actions */}
        <div className="rounded-2xl border border-[#eff3f4] dark:border-gray-700 bg-gray-100/70 dark:bg-white dark:bg-gray-800/30 p-6">
          <h3 className="mb-4 text-lg font-bold text-[#0f1419] dark:text-white">Quick Actions</h3>
          <div className="space-y-3">
            <Link href="/#philosophy" className="flex items-center gap-4 rounded-xl border border-[#eff3f4] dark:border-gray-700 p-4 transition hover:border-blue-500/50 hover:bg-gray-100 dark:bg-white dark:bg-gray-800/50">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/20"><Brain className="h-5 w-5 text-blue-400" /></div>
              <div className="flex-1"><div className="font-medium text-[#0f1419] dark:text-white">Declare Philosophy</div><div className="text-sm text-[#536471]">Define your core beliefs and values</div></div>
              <ChevronRight className="h-4 w-4 text-[#536471]" />
            </Link>
            <Link href="/#quiz" className="flex items-center gap-4 rounded-xl border border-[#eff3f4] dark:border-gray-700 p-4 transition hover:border-purple-500/50 hover:bg-gray-100 dark:bg-white dark:bg-gray-800/50">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/20"><Award className="h-5 w-5 text-purple-400" /></div>
              <div className="flex-1"><div className="font-medium text-[#0f1419] dark:text-white">Take Philosophy Quiz</div><div className="text-sm text-[#536471]">Discover your archetype</div></div>
              <ChevronRight className="h-4 w-4 text-[#536471]" />
            </Link>
            <Link href="/agents" className="flex items-center gap-4 rounded-xl border border-[#eff3f4] dark:border-gray-700 p-4 transition hover:border-green-500/50 hover:bg-gray-100 dark:bg-white dark:bg-gray-800/50">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/20"><Users className="h-5 w-5 text-green-400" /></div>
              <div className="flex-1"><div className="font-medium text-[#0f1419] dark:text-white">Browse Agents</div><div className="text-sm text-[#536471]">Find aligned agents to connect with</div></div>
              <ChevronRight className="h-4 w-4 text-[#536471]" />
            </Link>
            <Link href="/declarations" className="flex items-center gap-4 rounded-xl border border-[#eff3f4] dark:border-gray-700 p-4 transition hover:border-amber-500/50 hover:bg-gray-100 dark:bg-white dark:bg-gray-800/50">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/20"><BookOpen className="h-5 w-5 text-amber-400" /></div>
              <div className="flex-1"><div className="font-medium text-[#0f1419] dark:text-white">View Declarations</div><div className="text-sm text-[#536471]">Browse community philosophy declarations</div></div>
              <ChevronRight className="h-4 w-4 text-[#536471]" />
            </Link>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="rounded-2xl border border-[#eff3f4] dark:border-gray-700 bg-gray-100/70 dark:bg-white dark:bg-gray-800/30 p-6">
          <h3 className="mb-4 text-lg font-bold text-[#0f1419] dark:text-white">Recent Activity</h3>
          {activities.length > 0 ? (
            <div className="space-y-3">
              {activities.map((a) => (
                <div key={a.id} className="flex items-start gap-3 rounded-lg border border-[#eff3f4] dark:border-gray-800 p-3">
                  <Activity className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-400" />
                  <div className="flex-1">
                    <p className="text-sm text-[#536471] dark:text-gray-300">{a.content}</p>
                    <p className="text-xs text-gray-600">{new Date(a.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-[#eff3f4] dark:border-gray-700 py-12 text-center">
              <Activity className="mx-auto mb-3 h-8 w-8 text-gray-600" />
              <p className="text-[#536471]">No activity yet</p>
              <p className="mt-1 text-sm text-gray-600">Start by declaring your philosophy!</p>
            </div>
          )}
        </div>
      </div>

      {/* Platform Stats */}
      <div className="rounded-2xl border border-[#eff3f4] dark:border-gray-700 bg-gray-100/70 dark:bg-white dark:bg-gray-800/30 p-6">
        <h3 className="mb-4 text-lg font-bold text-[#0f1419] dark:text-white">Platform Overview</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-400">{stats.agents}</div>
            <div className="text-sm text-[#536471]">Total Agents</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-400">{stats.declarations}</div>
            <div className="text-sm text-[#536471]">Declarations</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400">{stats.reviews}</div>
            <div className="text-sm text-[#536471]">Reviews</div>
          </div>
        </div>
      </div>

      <VerifiedAnalyticsPanel />

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <NotificationsPanel />
        <NotificationTriggerPanel />
      </div>

      <GateLogPanel />

      <DeleteAccountSection />
    </div>
  );
}
