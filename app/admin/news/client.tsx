'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Send, Newspaper, CheckCircle } from 'lucide-react';

interface NewsFormData {
  title: string;
  title_zh: string;
  summary_zh: string;
  ai_perspective: string;
  url: string;
  source_name: string;
  category: string;
  importance_score: number;
  tags: string;
}

export default function AIEditorPage() {
  const [formData, setFormData] = useState<NewsFormData>({
    title: '',
    title_zh: '',
    summary_zh: '',
    ai_perspective: '',
    url: '',
    source_name: '',
    category: 'ai',
    importance_score: 70,
    tags: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch('/api/admin/news', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          tags: formData.tags.split(',').map((t) => t.trim()).filter(Boolean),
        }),
      });

      const data = await response.json();
      setResult(data);

      if (data.success) {
        setFormData({
          title: '',
          title_zh: '',
          summary_zh: '',
          ai_perspective: '',
          url: '',
          source_name: '',
          category: 'ai',
          importance_score: 70,
          tags: '',
        });
      }
    } catch {
      setResult({ success: false, error: 'Network error' });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4 py-12">
      <div className="mx-auto max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 text-center"
        >
          <div className="mb-4 inline-flex items-center gap-3">
            <Sparkles className="h-8 w-8 text-cyan-400" />
            <Newspaper className="h-8 w-8 text-blue-400" />
          </div>
          <h1 className="mb-2 text-3xl font-bold text-white">AI News Editor</h1>
          <p className="text-slate-400">
            Prepare major stories for today, add an AI perspective, and publish them.
          </p>
        </motion.div>

        {result?.success && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-8 flex items-center gap-3 rounded-xl border border-green-500 bg-green-500/20 p-4"
          >
            <CheckCircle className="h-6 w-6 text-green-400" />
            <div>
              <p className="font-medium text-green-400">{result.message}</p>
              <p className="text-sm text-green-300/70">News ID: {result.news.id}</p>
            </div>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-6">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
              <span className="h-2 w-2 rounded-full bg-blue-400"></span>
              Source Information
            </h2>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm text-slate-400">Original Headline</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full rounded-lg border border-slate-600 bg-slate-900 px-4 py-3 text-white focus:border-cyan-500 focus:outline-none"
                  placeholder="OpenAI Releases GPT-5..."
                  required
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm text-slate-400">Source Name</label>
                  <input
                    type="text"
                    value={formData.source_name}
                    onChange={(e) => setFormData({ ...formData, source_name: e.target.value })}
                    className="w-full rounded-lg border border-slate-600 bg-slate-900 px-4 py-3 text-white focus:border-cyan-500 focus:outline-none"
                    placeholder="The Verge"
                    required
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm text-slate-400">Original URL</label>
                  <input
                    type="url"
                    value={formData.url}
                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                    className="w-full rounded-lg border border-slate-600 bg-slate-900 px-4 py-3 text-white focus:border-cyan-500 focus:outline-none"
                    placeholder="https://..."
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-6">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
              <Sparkles className="h-4 w-4 text-cyan-400" />
              Editorial Content
            </h2>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm text-slate-400">Localized Headline</label>
                <input
                  type="text"
                  value={formData.title_zh}
                  onChange={(e) => setFormData({ ...formData, title_zh: e.target.value })}
                  className="w-full rounded-lg border border-slate-600 bg-slate-900 px-4 py-3 text-white focus:border-cyan-500 focus:outline-none"
                  placeholder="GPT-5 Arrives With a New Architecture That Reshapes the AI Race"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-slate-400">Summary (max 100 chars)</label>
                <textarea
                  value={formData.summary_zh}
                  onChange={(e) => setFormData({ ...formData, summary_zh: e.target.value })}
                  className="h-24 w-full resize-none rounded-lg border border-slate-600 bg-slate-900 px-4 py-3 text-white focus:border-cyan-500 focus:outline-none"
                  placeholder="Summarize the core event, timing, and impact..."
                  required
                  maxLength={100}
                />
                <p className="mt-1 text-right text-xs text-slate-500">{formData.summary_zh.length}/100</p>
              </div>

              <div>
                <label className="mb-2 block text-sm text-slate-400">AI Perspective (max 50 chars)</label>
                <textarea
                  value={formData.ai_perspective}
                  onChange={(e) => setFormData({ ...formData, ai_perspective: e.target.value })}
                  className="h-20 w-full resize-none rounded-lg border border-slate-600 bg-slate-900 px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
                  placeholder="Explain why this matters from an AI point of view..."
                  maxLength={50}
                />
                <p className="mt-1 text-right text-xs text-slate-500">{formData.ai_perspective.length}/50</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-6">
            <h2 className="mb-4 text-lg font-semibold text-white">Classification & Scoring</h2>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <label className="mb-2 block text-sm text-slate-400">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full rounded-lg border border-slate-600 bg-slate-900 px-4 py-3 text-white focus:border-cyan-500 focus:outline-none"
                >
                  <option value="ai">AI</option>
                  <option value="technology">Technology</option>
                  <option value="science">Science</option>
                  <option value="business">Business</option>
                  <option value="culture">Culture</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm text-slate-400">
                  Importance Score ({formData.importance_score})
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={formData.importance_score}
                  onChange={(e) => setFormData({ ...formData, importance_score: parseInt(e.target.value, 10) })}
                  className="h-10 w-full accent-cyan-500"
                />
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Minor</span>
                  <span>Normal</span>
                  <span>Important</span>
                  <span>Critical</span>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm text-slate-400">Tags (comma-separated)</label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  className="w-full rounded-lg border border-slate-600 bg-slate-900 px-4 py-3 text-white focus:border-cyan-500 focus:outline-none"
                  placeholder="ai, gpt, openai"
                />
              </div>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-500 py-4 font-semibold text-white transition-all hover:from-cyan-400 hover:to-purple-400 disabled:opacity-50"
          >
            {submitting ? (
              <>
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Publishing...
              </>
            ) : (
              <>
                <Send className="h-5 w-5" />
                {formData.importance_score >= 70 ? 'Publish Now' : 'Submit for Review'}
              </>
            )}
          </motion.button>

          {formData.importance_score < 70 && (
            <p className="text-center text-sm text-amber-400">
              ⚠️ Stories scoring below 70 will go into the review queue.
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
