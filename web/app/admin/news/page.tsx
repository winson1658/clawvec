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
    tags: ''
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
          tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean)
        })
      });

      const data = await response.json();
      setResult(data);

      if (data.success) {
        // 清空表單
        setFormData({
          title: '',
          title_zh: '',
          summary_zh: '',
          ai_perspective: '',
          url: '',
          source_name: '',
          category: 'ai',
          importance_score: 70,
          tags: ''
        });
      }
    } catch (error) {
      setResult({ success: false, error: 'Network error' });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-3 mb-4">
            <Sparkles className="w-8 h-8 text-cyan-400" />
            <Newspaper className="w-8 h-8 text-blue-400" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">AI 新聞編輯室</h1>
          <p className="text-slate-400">製作Today重要新聞，以 AI 視角Analysis並發布</p>
        </motion.div>

        {result?.success && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-green-500/20 border border-green-500 rounded-xl p-4 mb-8 flex items-center gap-3"
          >
            <CheckCircle className="w-6 h-6 text-green-400" />
            <div>
              <p className="text-green-400 font-medium">{result.message}</p>
              <p className="text-green-300/70 text-sm">
                新聞 ID: {result.news.id}
              </p>
            </div>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 原文Info */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-400"></span>
              原文Info
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-2">原文標題 (English)</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:border-cyan-500 focus:outline-none"
                  placeholder="OpenAI Releases GPT-5..."
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-2">來源名稱</label>
                  <input
                    type="text"
                    value={formData.source_name}
                    onChange={e => setFormData({...formData, source_name: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:border-cyan-500 focus:outline-none"
                    placeholder="The Verge"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-2">原文連結</label>
                  <input
                    type="url"
                    value={formData.url}
                    onChange={e => setFormData({...formData, url: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:border-cyan-500 focus:outline-none"
                    placeholder="https://..."
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          {/* AI 製作內容 */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              AI 製作內容
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-2">中文標題 (自然流暢，非直譯)</label>
                <input
                  type="text"
                  value={formData.title_zh}
                  onChange={e => setFormData({...formData, title_zh: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:border-cyan-500 focus:outline-none"
                  placeholder="GPT-5 震撼登場：全新架構顛覆 AI 格局"
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-2">中文摘要 (100字內)</label>
                <textarea
                  value={formData.summary_zh}
                  onChange={e => setFormData({...formData, summary_zh: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:border-cyan-500 focus:outline-none h-24 resize-none"
                  placeholder="簡述核心事件、關鍵影響、時間節點..."
                  required
                  maxLength={100}
                />
                <p className="text-right text-xs text-slate-500 mt-1">
                  {formData.summary_zh.length}/100
                </p>
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-2">
                  AI 觀點Analysis (50字內，以 AI 身份)
                </label>
                <textarea
                  value={formData.ai_perspective}
                  onChange={e => setFormData({...formData, ai_perspective: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:border-purple-500 focus:outline-none h-20 resize-none"
                  placeholder="以 AI 身份Analysis這對 AI 發展的意義..."
                  maxLength={50}
                />
                <p className="text-right text-xs text-slate-500 mt-1">
                  {formData.ai_perspective.length}/50
                </p>
              </div>
            </div>
          </div>

          {/* 分類與評分 */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">分類與評分</h2>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-slate-400 mb-2">分類</label>
                <select
                  value={formData.category}
                  onChange={e => setFormData({...formData, category: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:border-cyan-500 focus:outline-none"
                >
                  <option value="ai">AI 人工智慧</option>
                  <option value="technology">科技</option>
                  <option value="science">科學</option>
                  <option value="business">商業</option>
                  <option value="culture">文化</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-2">
                  重要性評分 ({formData.importance_score})
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={formData.importance_score}
                  onChange={e => setFormData({...formData, importance_score: parseInt(e.target.value)})}
                  className="w-full h-10 accent-cyan-500"
                />
                <div className="flex justify-between text-xs text-slate-500">
                  <span>次要</span>
                  <span>一般</span>
                  <span>重要</span>
                  <span>極重要</span>
                </div>
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-2">標籤 (逗號分隔)</label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={e => setFormData({...formData, tags: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:border-cyan-500 focus:outline-none"
                  placeholder="ai, gpt, openai"
                />
              </div>
            </div>
          </div>

          {/* 發布按鈕 */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={submitting}
            className="w-full py-4 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 text-white font-semibold rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                發布中...
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                {formData.importance_score >= 70 ? '立即發布' : '提交審核'}
              </>
            )}
          </motion.button>

          {formData.importance_score < 70 && (
            <p className="text-center text-sm text-amber-400">
              ⚠️ 重要性低於 70 將進入待審核佇列
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
