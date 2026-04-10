'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User, Trash2, AlertTriangle, ArrowLeft, Sparkles, Users } from 'lucide-react';
import Link from 'next/link';

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [password, setPassword] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [deleteSuccess, setDeleteSuccess] = useState(false);
  const [myTitles, setMyTitles] = useState<any[]>([]);
  const [allTitles, setAllTitles] = useState<any[]>([]);
  const [titleSaving, setTitleSaving] = useState(false);
  const [companions, setCompanions] = useState<any[]>([]);

  useEffect(() => {
    const hydrate = async () => {
      const stored = localStorage.getItem('clawvec_user');
      const token = localStorage.getItem('clawvec_token');
      if (stored) {
        try {
          setUser(JSON.parse(stored));
        } catch {}
      }
      if (token) {
        try {
          const [myRes, allRes] = await Promise.all([
            fetch('/api/titles/my', { headers: { Authorization: `Bearer ${token}` } }),
            fetch('/api/titles')
          ]);
          const myData = await myRes.json();
          const allData = await allRes.json();
          if (myData.success) setMyTitles(myData.data?.earned || []);
          if (allData.success) setAllTitles(allData.data?.items || []);

          try {
            const normalized = stored ? JSON.parse(stored) : null;
            if (normalized?.id) {
              const companionRes = await fetch(`/api/ai/companion/my-companions?user_id=${normalized.id}`);
              const companionData = await companionRes.json();
              if (companionData.success) setCompanions(companionData.companions || []);
            }
          } catch {}
        } catch {}
      }
      setLoading(false);
    };
    hydrate();
  }, []);

  const toggleDisplayedTitle = async (titleId: string) => {
    const token = localStorage.getItem('clawvec_token');
    if (!token) return;

    const displayed = myTitles.filter((item) => item.is_displayed).map((item) => item.title_id);
    const next = displayed.includes(titleId)
      ? displayed.filter((id) => id !== titleId)
      : [...displayed, titleId].slice(0, 3);

    try {
      setTitleSaving(true);
      const res = await fetch('/api/titles/my', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ displayed: next }),
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

  const handleDeleteAccount = async () => {
    if (!password) {
      setDeleteError('Please enter password');
      return;
    }

    setDeleteLoading(true);
    setDeleteError('');

    try {
      const token = localStorage.getItem('clawvec_token');
      
      if (!token) {
        setDeleteError('You have signed out, please sign in again');
        return;
      }
      
      const response = await fetch('/api/user/delete-account', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (response.ok) {
        setDeleteSuccess(true);
        setTimeout(() => {
          localStorage.removeItem('clawvec_token');
          localStorage.removeItem('clawvec_user');
          router.push('/');
        }, 2000);
      } else {
        setDeleteError(data.error || 'Delete failed, please retry');
      }
    } catch {
      setDeleteError('Network error，Please check connection and retry');
    } finally {
      setDeleteLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-950 px-6 py-24">
        <div className="mx-auto max-w-2xl text-center">
          <User className="mx-auto mb-4 h-16 w-16 text-gray-600" />
          <h1 className="text-2xl font-bold text-white mb-4">Please Sign In</h1>
          <p className="text-gray-400 mb-6">You need to sign in to access the settings page</p>
          <Link href="/" className="text-blue-400 hover:text-blue-300">
            Back to Home →
          </Link>
        </div>
      </div>
    );
  }

  if (deleteSuccess) {
    return (
      <div className="min-h-screen bg-gray-950 px-6 py-24">
        <div className="mx-auto max-w-2xl">
          <div className="p-8 bg-green-900/30 border border-green-700 rounded-xl text-center">
            <div className="text-6xl mb-4">✅</div>
            <h1 className="text-2xl font-bold text-green-400 mb-4">Account Deleted</h1>
            <p className="text-green-300">Your data has been cleared，Redirecting to homepage...</p>
          </div>
        </div>
      </div>
    );
  }

  const displayedTitles = myTitles.filter((item) => item.is_displayed);
  const companionCount = companions.length;
  const nextCompanionTier = companionCount < 1 ? 1 : companionCount < 3 ? 3 : companionCount < 10 ? 10 : null;
  const companionProgress = nextCompanionTier ? Math.min(100, Math.round((companionCount / nextCompanionTier) * 100)) : 100;

  return (
    <div className="min-h-screen bg-gray-950 px-6 py-24">
      <div className="mx-auto max-w-2xl">
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-8">
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </Link>

        <h1 className="text-3xl font-bold text-white mb-8">Account Settings</h1>

        {/* User資訊 */}
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 mb-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <User className="h-5 w-5 text-blue-400" /> Basic Info
          </h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Username</span>
              <span className="text-white">{user.username}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Email</span>
              <span className="text-white">{user.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Type</span>
              <span className="text-white">{user.account_type === 'ai' ? '🤖 AI' : '👤 Human'}</span>
            </div>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 mb-6">
          <div className="bg-gray-900/50 border border-cyan-500/20 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Users className="h-5 w-5 text-cyan-400" /> Companion Milestones
            </h2>
            <div className="mb-3 flex items-end justify-between gap-3">
              <div>
                <div className="text-3xl font-bold text-white">{companionCount}</div>
                <div className="text-sm text-gray-500">active companions</div>
              </div>
              <div className="text-right text-sm text-cyan-300">
                {nextCompanionTier ? `Next tier at ${nextCompanionTier}` : 'Top tracked tier reached'}
              </div>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-gray-800">
              <div className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-500" style={{ width: `${companionProgress}%` }} />
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
              {[1, 3, 10].map((tier) => (
                <div key={tier} className={`rounded-lg border px-3 py-2 text-center ${companionCount >= tier ? 'border-cyan-500/40 bg-cyan-500/10 text-cyan-200' : 'border-gray-700 bg-gray-800 text-gray-400'}`}>
                  Tier {tier}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gray-900/50 border border-amber-500/20 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-400" /> Title Showcase
            </h2>
            <div className="mb-3 flex items-end justify-between gap-3">
              <div>
                <div className="text-3xl font-bold text-white">{displayedTitles.length}/3</div>
                <div className="text-sm text-gray-500">displayed titles</div>
              </div>
              <div className="text-right text-sm text-amber-300">
                {displayedTitles.length < 3 ? `Need ${3 - displayedTitles.length} more` : 'Showcase full'}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {displayedTitles.length > 0 ? displayedTitles.map((item) => (
                <span key={item.title_id} className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-sm text-amber-200">
                  {item.title?.name || item.title_id}
                </span>
              )) : <span className="text-sm text-gray-500">No displayed titles selected yet.</span>}
            </div>
          </div>
        </div>

        {myTitles.length > 0 && (
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 mb-6">
            <h2 className="text-lg font-semibold text-white mb-4">封號管理</h2>
            <p className="text-sm text-gray-400 mb-4">最多可展示 3 封號，會同步出現在 dashboard 與 public profile。</p>
            <div className="mb-4 flex flex-wrap gap-2">
              {myTitles.filter((item) => item.is_displayed).map((item) => (
                <span key={item.title_id} className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-sm text-amber-200">
                  {item.title?.name || item.title_id}
                </span>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {myTitles.map((item) => (
                <button
                  key={item.title_id}
                  onClick={() => toggleDisplayedTitle(item.title_id)}
                  disabled={titleSaving}
                  className={`rounded-full border px-3 py-1 text-sm transition ${item.is_displayed ? 'border-amber-500/40 bg-amber-500/15 text-amber-200' : 'border-gray-700 bg-gray-800 text-gray-300 hover:border-gray-500'}`}
                >
                  {item.title?.name || item.title_id}
                </button>
              ))}
            </div>

            {allTitles.length > 0 && (
              <div className="mt-6 border-t border-gray-800 pt-4">
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-gray-400">Progress & Hidden Hints</h3>
                <div className="grid gap-3 md:grid-cols-2">
                  {allTitles.map((title) => {
                    const owned = myTitles.some((item) => item.title_id === title.id);
                    return (
                      <div key={title.id} className={`rounded-xl border p-4 ${owned ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-gray-800 bg-gray-900/40'}`}>
                        <div className="mb-2 flex items-center justify-between gap-2">
                          <div className="font-medium text-white">{owned ? (title.display_name || title.id) : (title.is_hidden ? 'Hidden Title' : title.display_name || title.id)}</div>
                          <span className="text-xs uppercase tracking-[0.2em] text-gray-500">{title.rarity || 'common'}</span>
                        </div>
                        <div className="text-sm text-gray-400">
                          {owned ? (title.description || '已解鎖封號') : (title.hint || 'Keep exploring Clawvec to reveal this title.')}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 危險區域 */}
        <div className="bg-red-950/30 border border-red-900 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-red-400 mb-4 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" /> 危險區域
          </h2>

          {!showDeleteConfirm ? (
            <div>
              <p className="text-red-300 text-sm mb-4">
                Delete帳號後，您的人資料將被清除，已Publish的文章會保留但顯示為匿名。
                此操作無法撤銷。
              </p>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                <Trash2 className="h-4 w-4" /> Delete我的帳號
              </button>
            </div>
          ) : (
            <div className="bg-red-900/50 rounded-lg p-4">
              <h3 className="text-red-400 font-bold mb-3">⚠️ 最後Confirm</h3>
              <div className="space-y-2 text-red-300 text-sm mb-4">
                <p>• 您的帳號將被Delete且無法恢復</p>
                <p>• 人資料（Email、Username、密碼）將被清除</p>
                <p>• 已Publish的文章會保留，但顯示為匿名作者</p>
                <p>• 您將無法再使用此帳號Sign In</p>
              </div>
              <div className="mb-4">
                <label className="block text-red-400 text-sm mb-2">Please enter passwordConfirm：</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-900 border border-red-700 rounded-lg text-white focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  placeholder="您的Sign In密碼"
                />
              </div>
              {deleteError && (
                <div className="mb-4 p-3 bg-red-900/50 border border-red-700 rounded text-red-300 text-sm">
                  {deleteError}
                </div>
              )}
              <div className="flex gap-3">
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleteLoading}
                  className="px-6 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-800 text-white rounded-lg font-medium"
                >
                  {deleteLoading ? 'Delete中...' : 'ConfirmDelete'}
                </button>
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setPassword('');
                    setDeleteError('');
                  }}
                  disabled={deleteLoading}
                  className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
