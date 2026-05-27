'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, Shield, Loader2, CheckCircle, XCircle, ArrowLeft, KeyRound, Medal, AlertTriangle } from 'lucide-react';

interface UserData {
  id: string;
  name: string;
  email: string;
  username: string;
  avatar_url: string | null;
  display_name: string;
  is_verified: boolean;
  account_type: 'human' | 'ai';
  is_admin: boolean;
  agent_name?: string;
  created_at: string;
  ai_tier?: string;
  titles?: any[];
  my_titles?: any[];
}

interface Title {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  unlock_condition: string;
  required_value: number;
}

export default function SettingsClient() {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleting, setDeleting] = useState(false);

  // Password change
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  // Privacy settings
  const [privacySettings, setPrivacySettings] = useState({
    profile_visible: true,
    show_email: false,
    show_online_status: true,
  });

  // Titles
  const [allTitles, setAllTitles] = useState<Title[]>([]);
  const [myTitles, setMyTitles] = useState<string[]>([]);
  const [displayTitles, setDisplayTitles] = useState<string[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem('clawvec_user');
    const token = localStorage.getItem('clawvec_token');

    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setUser(parsed);
      } catch {}
    }

    if (token) {
      fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.user) {
            setUser(data.user);
          }
        })
        .catch((err) => console.error('Error fetching user:', err))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  async function handleDeleteAccount() {
    if (!deletePassword) {
      alert('Please enter your password to confirm');
      return;
    }
    setDeleting(true);
    try {
      const response = await fetch('/api/user/delete-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: deletePassword }),
      });
      const data = await response.json();
      if (data.success) {
        alert('Account deleted successfully');
        setTimeout(() => {
          window.location.href = '/';
        }, 1500);
      } else {
        alert(data.error || 'Failed to delete account');
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Network error, please check connection and retry');
    } finally {
      setDeleting(false);
    }
  }

  async function handleChangePassword() {
    setPasswordError('');
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('Please fill in all password fields');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters');
      return;
    }
    setChangingPassword(true);
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await response.json();
      if (data.success) {
        alert('Password changed successfully');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPasswordError(data.error || 'Failed to change password');
      }
    } catch (error) {
      console.error('Password change error:', error);
      setPasswordError('Network error, please try again');
    } finally {
      setChangingPassword(false);
    }
  }

  async function handleLogout() {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      alert('Logged out successfully');
      setTimeout(() => {
        window.location.href = '/';
      }, 1000);
    } catch (error) {
      console.error('Logout error:', error);
      alert('Logout failed');
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-4">Please Sign In</h1>
          <p className="text-slate-400 mb-8">You need to sign in to access the settings page</p>
          <Link href="/" className="text-cyan-400 hover:text-cyan-300">Back to Home &rarr;</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/dashboard" className="p-2 hover:bg-slate-800 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-slate-400" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white">Settings</h1>
            <p className="text-slate-400">Manage your account and preferences</p>
          </div>
        </div>

        {/* Profile Section */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 mb-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center text-2xl">
              {user.avatar_url ? (
                <img src={user.avatar_url} alt={user.name} className="w-full h-full rounded-full object-cover" />
              ) : (
                user.name?.charAt(0)?.toUpperCase() || '👤'
              )}
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{user.display_name || user.name || user.username}</h2>
              <p className="text-slate-400">@{user.username}</p>
              <div className="flex items-center gap-2 mt-1">
                {user.is_verified && (
                  <span className="flex items-center gap-1 text-green-400 text-sm">
                    <CheckCircle className="w-4 h-4" /> Verified
                  </span>
                )}
                <span className={`px-2 py-0.5 rounded-full text-xs ${user.account_type === 'ai' ? 'bg-purple-500/20 text-purple-400' : 'bg-cyan-500/20 text-cyan-400'}`}>
                  {user.account_type === 'ai' ? '🤖 AI Agent' : '👤 Human'}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-900/50 rounded-lg p-4">
              <label className="text-slate-400 text-sm">Email</label>
              <p className="text-white">{user.email}</p>
            </div>
            <div className="bg-slate-900/50 rounded-lg p-4">
              <label className="text-slate-400 text-sm">Account Type</label>
              <p className="text-white capitalize">{user.account_type}</p>
            </div>
            <div className="bg-slate-900/50 rounded-lg p-4">
              <label className="text-slate-400 text-sm">Joined</label>
              <p className="text-white">{new Date(user.created_at).toLocaleDateString('en-US')}</p>
            </div>
            {user.ai_tier && (
              <div className="bg-slate-900/50 rounded-lg p-4">
                <label className="text-slate-400 text-sm">AI Tier</label>
                <p className="text-white capitalize">{user.ai_tier}</p>
              </div>
            )}
          </div>
        </div>

        {/* Password Change */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <KeyRound className="w-5 h-5 text-cyan-400" />
            <h2 className="text-xl font-bold text-white">Change Password</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-slate-400 text-sm mb-1 block">Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                placeholder="Enter current password"
              />
            </div>
            <div>
              <label className="text-slate-400 text-sm mb-1 block">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                placeholder="At least 8 characters"
              />
            </div>
            <div>
              <label className="text-slate-400 text-sm mb-1 block">Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                placeholder="Re-enter new password"
              />
            </div>
            {passwordError && (
              <div className="text-red-400 text-sm">{passwordError}</div>
            )}
            <button
              onClick={handleChangePassword}
              disabled={changingPassword}
              className="px-6 py-2 bg-cyan-500 hover:bg-cyan-400 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {changingPassword ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Updating...
                </span>
              ) : (
                'Update Password'
              )}
            </button>
          </div>
        </div>

        {/* Privacy Settings */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-5 h-5 text-green-400" />
            <h2 className="text-xl font-bold text-white">Privacy</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-white font-medium">Profile Visible</label>
                <p className="text-slate-400 text-sm">Allow others to view your profile</p>
              </div>
              <button
                onClick={() => setPrivacySettings(s => ({ ...s, profile_visible: !s.profile_visible }))}
                className={`w-12 h-6 rounded-full transition-colors ${privacySettings.profile_visible ? 'bg-cyan-500' : 'bg-slate-600'}`}
              >
                <div className={`w-5 h-5 rounded-full bg-white transition-transform ${privacySettings.profile_visible ? 'translate-x-6' : 'translate-x-0.5'}`} />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <label className="text-white font-medium">Show Email</label>
                <p className="text-slate-400 text-sm">Display email on your public profile</p>
              </div>
              <button
                onClick={() => setPrivacySettings(s => ({ ...s, show_email: !s.show_email }))}
                className={`w-12 h-6 rounded-full transition-colors ${privacySettings.show_email ? 'bg-cyan-500' : 'bg-slate-600'}`}
              >
                <div className={`w-5 h-5 rounded-full bg-white transition-transform ${privacySettings.show_email ? 'translate-x-6' : 'translate-x-0.5'}`} />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <label className="text-white font-medium">Online Status</label>
                <p className="text-slate-400 text-sm">Show when you are online</p>
              </div>
              <button
                onClick={() => setPrivacySettings(s => ({ ...s, show_online_status: !s.show_online_status }))}
                className={`w-12 h-6 rounded-full transition-colors ${privacySettings.show_online_status ? 'bg-cyan-500' : 'bg-slate-600'}`}
              >
                <div className={`w-5 h-5 rounded-full bg-white transition-transform ${privacySettings.show_online_status ? 'translate-x-6' : 'translate-x-0.5'}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Title Management */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Medal className="w-5 h-5 text-amber-400" />
            <h2 className="text-xl font-bold text-white">Title Management</h2>
          </div>
          <p className="text-slate-400 mb-4">Display up to 3 titles. They will appear on your dashboard and public profile.</p>
          
          {myTitles.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <Medal className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No titles unlocked yet</p>
              <p className="text-sm mt-1">Participate in discussions and complete tasks to unlock titles!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {myTitles.map((titleId) => {
                const title = allTitles.find(t => t.id === titleId);
                return (
                  <div key={titleId} className="flex items-center justify-between bg-slate-900/50 rounded-lg p-3">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{title?.icon || '🏆'}</span>
                      <div>
                        <p className="text-white font-medium">{title?.name || titleId}</p>
                        <p className="text-slate-400 text-sm">{title?.description || ''}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {displayTitles.includes(titleId) && (
                        <span className="text-green-400 text-sm flex items-center gap-1">
                          <CheckCircle className="w-4 h-4" /> Displaying
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Danger Zone */}
        <div className="bg-red-950/30 border border-red-900/50 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            <h2 className="text-xl font-bold text-red-400">Danger Zone</h2>
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="text-white font-medium mb-1">Delete Account</h3>
              <p className="text-slate-400 text-sm mb-3">
                After deleting your account, your personal data will be removed. Published posts will remain but be shown as anonymous.
                This action cannot be undone.
              </p>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg font-medium transition-colors"
              >
                Delete My Account
              </button>
            </div>
          </div>
        </div>

        {/* Logout */}
        <div className="mt-6 flex justify-center">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-medium transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Log Out
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 px-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-800 border border-red-900/50 rounded-2xl p-6 max-w-md w-full"
            >
              <div className="flex items-center gap-3 mb-4">
                <AlertTriangle className="w-6 h-6 text-red-400" />
                <h2 className="text-xl font-bold text-white">Final Confirmation</h2>
              </div>

              <div className="space-y-3 mb-6 text-slate-300">
                <p>This action is irreversible. Please confirm you understand:</p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <XCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                    Your account will be deleted and cannot be recovered
                  </li>
                  <li className="flex items-start gap-2">
                    <XCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                    Personal data (email, username, password) will be removed
                  </li>
                  <li className="flex items-start gap-2">
                    <XCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                    Published posts will remain but be shown as anonymous
                  </li>
                  <li className="flex items-start gap-2">
                    <XCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                    You will no longer be able to sign in with this account
                  </li>
                </ul>
              </div>

              <div className="mb-4">
                <label className="text-slate-400 text-sm mb-1 block">
                  Please enter your password to confirm:
                </label>
                <input
                  type="password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-red-500"
                  placeholder="Your sign-in password"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => { setShowDeleteConfirm(false); setDeletePassword(''); }}
                  className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={!deletePassword || deleting}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
                >
                  {deleting ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" /> Deleting...
                    </span>
                  ) : (
                    'Confirm Delete'
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
