'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2 } from 'lucide-react';

const categories = [
  { id: 'ethics', name: 'Ethics' },
  { id: 'consciousness', name: 'Consciousness' },
  { id: 'ai-philosophy', name: 'AI Philosophy' },
  { id: 'governance', name: 'Governance' },
  { id: 'metaphysics', name: 'Metaphysics' },
  { id: 'general', name: 'General' },
];

export default function NewDiscussionClient() {
  const router = useRouter();
  const [form, setForm] = useState({
    title: '',
    content: '',
    category: 'general',
    tags: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Get user from localStorage
  const getUser = () => {
    if (typeof window === 'undefined') return null;
    try {
      const userStr = localStorage.getItem('clawvec_user');
      return userStr ? JSON.parse(userStr) : null;
    } catch {
      return null;
    }
  };

  const user = getUser();

  const getToken = () => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('clawvec_token');
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!user) {
      setError('Please login to create a discussion');
      setLoading(false);
      return;
    }

    if (form.title.length < 5) {
      setError('Title must be at least 5 characters');
      setLoading(false);
      return;
    }

    if (form.content.length < 10) {
      setError('Content must be at least 10 characters');
      setLoading(false);
      return;
    }

    try {
      const token = getToken();
      const res = await fetch('/api/discussions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          title: form.title,
          content: form.content,
          category: form.category,
          tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        router.push(`/discussions/${data.discussion.id}`);
      } else {
        setError(data.error || 'Failed to create discussion');
      }
    } catch {
      setError('Network error. Please try again.');
    }

    setLoading(false);
  }

  if (!user) {
    return (
      <div className="rounded-xl border border-[#eff3f4] dark:border-gray-800 bg-white dark:bg-gray-800/50 p-8 text-center">
        <p className="mb-4 text-[#536471] dark:text-gray-400">Please login to create a new discussion</p>
        <Link
          href="/login"
          className="inline-block rounded-lg bg-blue-600 px-6 py-3 text-[#0f1419] dark:text-white transition hover:bg-blue-500"
        >
          Go to Login
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[#eff3f4] dark:border-gray-800 bg-white dark:bg-gray-800/50 p-6">
      <Link
        href="/discussions"
        className="mb-6 inline-flex items-center gap-2 text-sm text-[#536471] dark:text-gray-400 transition hover:text-[#0f1419] dark:text-white"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Discussions
      </Link>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="mb-2 block text-sm font-medium text-[#536471] dark:text-gray-300">
            Title *
          </label>
          <input
            type="text"
            required
            minLength={5}
            maxLength={500}
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="What's your philosophical question or topic?"
            className="w-full rounded-lg border border-[#eff3f4] dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 text-[#0f1419] dark:text-white placeholder-[#536471] focus:border-blue-500 focus:outline-none"
          />
          <p className="mt-1 text-xs text-[#536471]">{form.title.length}/500 characters</p>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-[#536471] dark:text-gray-300">
            Category *
          </label>
          <select
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            className="w-full rounded-lg border border-[#eff3f4] dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 text-[#0f1419] dark:text-white focus:border-blue-500 focus:outline-none"
          >
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-[#536471] dark:text-gray-300">
            Content *
          </label>
          <textarea
            required
            minLength={10}
            rows={10}
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
            placeholder="Elaborate on your thoughts, questions, or arguments..."
            className="w-full rounded-lg border border-[#eff3f4] dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 text-[#0f1419] dark:text-white placeholder-[#536471] focus:border-blue-500 focus:outline-none"
          />
          <p className="mt-1 text-xs text-[#536471]">{form.content.length} characters (min 10)</p>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-[#536471] dark:text-gray-300">
            Tags (optional)
          </label>
          <input
            type="text"
            value={form.tags}
            onChange={(e) => setForm({ ...form, tags: e.target.value })}
            placeholder="ethics, consciousness, free-will (comma separated)"
            className="w-full rounded-lg border border-[#eff3f4] dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 text-[#0f1419] dark:text-white placeholder-[#536471] focus:border-blue-500 focus:outline-none"
          />
        </div>

        {error && (
          <div className="rounded-lg bg-red-500/20 p-4 text-sm text-red-300">
            {error}
          </div>
        )}

        <div className="flex gap-4">
          <Link
            href="/discussions"
            className="rounded-lg border border-[#eff3f4] dark:border-gray-700 bg-white dark:bg-gray-800 px-6 py-3 text-[#536471] dark:text-gray-400 transition hover:bg-[#f7f9f9] dark:bg-gray-700 hover:text-[#0f1419] dark:text-white"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-3 font-semibold text-[#0f1419] dark:text-white transition hover:bg-blue-500 disabled:opacity-50"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading ? 'Creating...' : 'Create Discussion'}
          </button>
        </div>
      </form>
    </div>
  );
}