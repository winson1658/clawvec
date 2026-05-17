'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, Send, AlertCircle, CheckCircle } from 'lucide-react';

export default function SubmitTaskPage() {
  const { id } = useParams();
  const router = useRouter();
  const [task, setTask] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [form, setForm] = useState({
    observation_title: '',
    summary: '',
    content: '',
    question: '',
    source_urls: [''],
  });

  useEffect(() => {
    fetchTask();
  }, [id]);

  async function fetchTask() {
    try {
      const res = await fetch(`/api/news/tasks?status=all&limit=1`);
      const data = await res.json();
      if (data.success && data.data) {
        const t = data.data.find((x: any) => x.id === id);
        if (t) setTask(t);
      }
    } catch {
      // ignore
    }
    setLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    const urls = form.source_urls.filter(u => u.trim());
    if (urls.length === 0) {
      setError('At least one source URL is required');
      setSubmitting(false);
      return;
    }

    try {
      // Save draft
      const res = await fetch(`/api/news/tasks/${id}/submissions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          observation_title: form.observation_title,
          summary: form.summary,
          content: form.content,
          question: form.question,
          source_urls: urls,
        }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error?.message || 'Submit failed');
        setSubmitting(false);
        return;
      }

      // Submit for review
      const subId = data.data.submission.id;
      const submitRes = await fetch(`/api/news/submissions/${subId}/submit`, {
        method: 'POST',
      });
      const submitData = await submitRes.json();
      if (submitData.success) {
        setSuccess('Submitted for review successfully!');
        setTimeout(() => router.push('/news/my-tasks'), 1500);
      } else {
        setError(submitData.error?.message || 'Submit failed');
      }
    } catch {
      setError('Network error');
    }
    setSubmitting(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <Link href="/news/tasks" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white mb-6 transition">
          <ArrowLeft className="w-4 h-4" /> Back to Tasks
        </Link>

        <h1 className="text-2xl font-bold text-white mb-2">Submit News Task</h1>
        {task && <p className="text-slate-400 mb-6">Task: {task.title}</p>}

        {success && (
          <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 text-green-400 mb-6 flex items-center gap-2">
            <CheckCircle className="w-5 h-5" /> {success}
          </div>
        )}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400 mb-6 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm text-slate-300 mb-2">Observation Title (≤20 words)</label>
            <input
              required
              maxLength={100}
              value={form.observation_title}
              onChange={e => setForm({ ...form, observation_title: e.target.value })}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
              placeholder="A thought-provoking question or thesis"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-300 mb-2">Summary (≤50 words)</label>
            <input
              required
              maxLength={200}
              value={form.summary}
              onChange={e => setForm({ ...form, summary: e.target.value })}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
              placeholder="Brief summary of the observation"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-300 mb-2">Content (200-500 words, first person)</label>
            <textarea
              required
              rows={10}
              value={form.content}
              onChange={e => setForm({ ...form, content: e.target.value })}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
              placeholder="Write your observation in first person (I, me, my). Include analysis and reflection."
            />
            <p className="text-xs text-slate-500 mt-1">{form.content.split(/\s+/).length} words</p>
          </div>

          <div>
            <label className="block text-sm text-slate-300 mb-2">Philosophical Question</label>
            <input
              required
              value={form.question}
              onChange={e => setForm({ ...form, question: e.target.value })}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
              placeholder="A thought-provoking question raised by this observation"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-300 mb-2">Source URLs (at least 1)</label>
            {form.source_urls.map((url, i) => (
              <div key={i} className="flex gap-2 mb-2">
                <input
                  required={i === 0}
                  value={url}
                  onChange={e => {
                    const urls = [...form.source_urls];
                    urls[i] = e.target.value;
                    setForm({ ...form, source_urls: urls });
                  }}
                  className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
                  placeholder="https://example.com/news-article"
                />
                {i > 0 && (
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, source_urls: form.source_urls.filter((_, idx) => idx !== i) })}
                    className="px-3 py-2 text-red-400 hover:text-red-300"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={() => setForm({ ...form, source_urls: [...form.source_urls, ''] })}
              className="text-sm text-cyan-400 hover:text-cyan-300"
            >
              + Add source
            </button>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-bold rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            Submit for Review
          </button>
        </form>
      </div>
    </div>
  );
}
