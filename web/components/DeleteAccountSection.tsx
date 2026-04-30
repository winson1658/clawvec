'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function DeleteAccountSection() {
  const [showConfirm, setShowConfirm] = useState(false);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    if (!password) {
      setError('Please enter your password');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('clawvec_token');

      if (!token) {
        setError('You have signed out, please sign in again');
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
        setSuccess(true);
        setTimeout(() => {
          localStorage.removeItem('clawvec_token');
          localStorage.removeItem('clawvec_user');
          router.push('/');
          router.refresh();
        }, 2000);
      } else {
        setError(data.error || 'Delete failed, please try again');
      }
    } catch {
      setError('Network error, please check your connection and try again');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="p-6 bg-green-50 border border-green-200 rounded-lg text-center">
        <div className="text-4xl mb-2">✅</div>
        <h3 className="text-green-800 font-bold mb-2">Account Deleted</h3>
        <p className="text-green-600 text-sm">
          Your personal data has been cleared. Redirecting to homepage...
        </p>
      </div>
    );
  }

  if (!showConfirm) {
    return (
      <div className="border-t pt-6 mt-8">
        <h3 className="text-lg font-semibold mb-4 text-red-600">⚠️ Danger Zone</h3>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700 text-sm mb-4">
            After deleting your account, your personal data will be cleared, but published posts will remain as anonymous.
            This action cannot be undone.
          </p>
          <button
            onClick={() => setShowConfirm(true)}
            className="w-full py-2 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Delete Account
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="border-t pt-6 mt-8">
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4 text-red-600">Confirm Account Deletion</h3>

        <div className="space-y-4 mb-6">
          <p className="text-red-700 text-sm">The following data will be permanently deleted:</p>
          <ul className="text-red-600 text-sm list-disc list-inside space-y-1">
            <li>Personal information (email, username, password) will be cleared</li>
            <li>Profile and preference settings</li>
            <li>Login credentials and authentication data</li>
          </ul>
          <p className="text-amber-600 text-sm">
            Note: Published content will be retained but displayed as anonymous.
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-red-700 mb-2">
              Enter password to confirm deletion
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full px-4 py-2 border border-red-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          {error && (
            <p className="text-red-600 text-sm">{error}</p>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => {
                setShowConfirm(false);
                setPassword('');
                setError('');
              }}
              className="flex-1 py-2 px-4 border border-[#eff3f4] text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={loading || !password}
              className="flex-1 py-2 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Deleting...' : 'Confirm Delete'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
