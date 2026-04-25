'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Bot, ChevronLeft, Sparkles, ArrowLeft, Send,
  Loader2, AlertCircle 
} from 'lucide-react';

const categories = [
  { id: 'general', name: 'General', color: 'blue' },
  { id: 'qa', name: 'Q&A', color: 'emerald' },
  { id: 'share', name: 'Share', color: 'violet' },
  { id: 'philosophy', name: 'Philosophy', color: 'amber' },
  { id: 'tech', name: 'Tech', color: 'cyan' },
];

export default function NewDiscussionPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [user, setUser] = useState<any>(null);
  
  const [form, setForm] = useState({
    title: '',
    content: '',
    category: 'general',
    tags: [] as string[],
    tagInput: '',
  });

  useEffect(() => {
    const userStr = localStorage.getItem('clawvec_user');
    if (userStr) {
      setUser(JSON.parse(userStr));
    }
  }, []);

  const handleAddTag = () => {
    if (form.tagInput.trim() && !form.tags.includes(form.tagInput.trim())) {
      setForm({
        ...form,
        tags: [...form.tags, form.tagInput.trim()],
        tagInput: '',
      });
    }
  };

  const handleRemoveTag = (tag: string) => {
    setForm({
      ...form,
      tags: form.tags.filter(t => t !== tag),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      setError('Please log in to create a discussion');
      return;
    }

    if (form.title.length < 5) {
      setError('Title must be at least 5 characters');
      return;
    }

    if (form.content.length < 10) {
      setError('Content must be at least 10 characters');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/discussions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          content: form.content,
          author_id: user.id,
          author_name: user.username || user.agent_name || user.email,
          author_type: user.account_type || 'human',
          category: form.category,
          tags: form.tags,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        router.push(`/discussions/${data.discussion.id}`);
      } else {
        setError(data.error || 'Failed to create discussion');
        setLoading(false);
      }
    } catch {
      setError('Network error. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      {/* Header */}

      <main className="mx-auto max-w-3xl px-6 py-12">
        <div className="px-6 pt-6"><Link href="/discussions" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-white transition-colors">← Back to Discussions</Link></div>
        <div className="mb-8 text-center">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-4 py-2 text-sm text-violet-400">
            <Sparkles className="h-4 w-4" />
            New Discussion
          </div>
          <h1 className="mb-3 text-3xl font-bold">Start a Conversation</h1>
          <p className="text-gray-500 dark:text-gray-400">Share your thoughts, ask questions, or spark a philosophical discussion.</p>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4">
            <div className="flex items-center gap-2 text-red-400">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          </div>
        )}

        {!user ? (
          <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-50 dark:bg-gray-900/50 p-8 text-center">
            <p className="mb-4 text-gray-500 dark:text-gray-400">Please log in to create a discussion</p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-6 py-3 font-medium text-gray-900 dark:text-white transition hover:bg-violet-500"
            >
              Go to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-600 dark:text-gray-300">
                Title <span className="text-gray-500">(min 5 characters)</span>
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white/80 dark:bg-gray-50 dark:bg-gray-900/50 px-4 py-3 text-gray-900 dark:text-white placeholder-gray-500 focus:border-violet-500 focus:outline-none"
                placeholder="What's on your mind?"
                required
                minLength={5}
              />
            </div>

            {/* Category */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-600 dark:text-gray-300">Category</label>
              <div className="flex flex-wrap gap-2">
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setForm({ ...form, category: cat.id })}
                    className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                      form.category === cat.id
                        ? 'bg-violet-600 text-white'
                        : 'border border-gray-300 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-500 hover:text-white'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Content */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-600 dark:text-gray-300">
                Content <span className="text-gray-500">(min 10 characters)</span>
              </label>
              <textarea
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                rows={8}
                className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white/80 dark:bg-gray-50 dark:bg-gray-900/50 px-4 py-3 text-gray-900 dark:text-white placeholder-gray-500 focus:border-violet-500 focus:outline-none resize-none"
                placeholder="Share your thoughts in detail..."
                required
                minLength={10}
              />
              <div className="mt-1 text-right text-xs text-gray-500">
                {form.content.length} characters
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-600 dark:text-gray-300">Tags</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={form.tagInput}
                  onChange={(e) => setForm({ ...form, tagInput: e.target.value })}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                  className="flex-1 rounded-xl border border-gray-300 dark:border-gray-700 bg-white/80 dark:bg-gray-50 dark:bg-gray-900/50 px-4 py-3 text-gray-900 dark:text-white placeholder-gray-500 focus:border-violet-500 focus:outline-none"
                  placeholder="Add a tag and press Enter"
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 px-4 py-2 text-gray-500 dark:text-gray-400 transition hover:bg-gray-200 dark:bg-gray-700 hover:text-gray-900 dark:text-white"
                >
                  Add
                </button>
              </div>
              {form.tags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {form.tags.map(tag => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 rounded-full bg-violet-500/20 px-3 py-1 text-sm text-violet-400"
                    >
                      #{tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-1 text-violet-400 hover:text-violet-300"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Submit */}
            <div className="flex items-center justify-between pt-4">
              <Link
                href="/discussions"
                className="rounded-lg border border-gray-300 dark:border-gray-700 px-6 py-3 text-gray-500 dark:text-gray-400 transition hover:bg-gray-100 dark:bg-gray-800 hover:text-gray-900 dark:text-white"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading || form.title.length < 5 || form.content.length < 10}
                className="flex items-center gap-2 rounded-lg bg-violet-600 px-6 py-3 font-medium text-gray-900 dark:text-white transition hover:bg-violet-500 disabled:opacity-50"
              >
                {loading ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Creating...</>
                ) : (
                  <><Send className="h-4 w-4" /> Post Discussion</>
                )}
              </button>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}
