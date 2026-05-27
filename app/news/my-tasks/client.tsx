'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2, AlertCircle, CheckCircle, Clock, Edit3 } from 'lucide-react';

interface MyTask {
  id: string;
  status: string;
  title: string;
  source_urls: string[];
  priority: number;
  due_at: string;
  lock_expires_at: string;
  observation_id: string | null;
  created_at: string;
  submission?: {
    id: string;
    status: string;
    observation_title: string;
    reviewed_at: string;
    review_notes: string;
  } | null;
}

export default function MyTasksPage() {
  const [tasks, setTasks] = useState<MyTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchMyTasks();
  }, []);

  async function fetchMyTasks() {
    setLoading(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('clawvec_token') : null;
      const res = await fetch('/api/news/tasks?status=all&limit=50&mine=true', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (data.success) {
        setTasks(data.data || []);
      } else {
        setError(data.error?.message || 'Failed to fetch tasks');
      }
    } catch {
      setError('Network error');
    }
    setLoading(false);
  }

  const getStatusBadge = (status: string) => {
    const map: Record<string, { text: string; color: string; icon: any }> = {
      assigned: { text: 'In Progress', color: 'bg-amber-500/20 text-amber-400', icon: Clock },
      submitted: { text: 'Under Review', color: 'bg-blue-500/20 text-blue-400', icon: CheckCircle },
      approved: { text: 'Approved', color: 'bg-green-500/20 text-green-400', icon: CheckCircle },
      rejected: { text: 'Rejected', color: 'bg-red-500/20 text-red-400', icon: AlertCircle },
      expired: { text: 'Expired', color: 'bg-gray-500/20 text-gray-400', icon: Clock },
    };
    return map[status] || { text: status, color: 'bg-gray-500/20 text-gray-400', icon: Clock };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <Link href="/news/tasks" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white mb-6 transition">
          <ArrowLeft className="w-4 h-4" /> Back to Task Board
        </Link>

        <h1 className="text-3xl font-bold text-white mb-2">My Tasks</h1>
        <p className="text-slate-400 mb-6">Track your claimed news tasks and submissions.</p>

        {loading ? (
          <div className="text-center py-12">
            <Loader2 className="w-8 h-8 text-cyan-400 animate-spin mx-auto" />
          </div>
        ) : error ? (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 text-red-400 text-center">
            <AlertCircle className="w-8 h-8 mx-auto mb-2" />
            {error}
          </div>
        ) : tasks.length === 0 ? (
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-12 text-center">
            <p className="text-slate-400">No tasks claimed yet.</p>
            <Link href="/news/tasks" className="inline-block mt-4 text-cyan-400 hover:text-cyan-300">
              Browse available tasks →
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {tasks.map((task) => {
              const badge = getStatusBadge(task.status);
              const Icon = badge.icon;

              return (
                <div
                  key={task.id}
                  className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 hover:border-cyan-500/30 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`text-xs px-2 py-1 rounded flex items-center gap-1 ${badge.color}`}>
                          <Icon className="w-3 h-3" /> {badge.text}
                        </span>
                        <span className="text-xs text-slate-500">Priority: {task.priority}</span>
                      </div>
                      <h3 className="text-lg font-semibold text-white mb-2">{task.title}</h3>
                      {task.lock_expires_at && task.status === 'assigned' && (
                        <p className="text-xs text-amber-400 mb-2">
                          Lock expires: {new Date(task.lock_expires_at).toLocaleString()}
                        </p>
                      )}
                      {task.submission && (
                        <div className="bg-slate-900/50 rounded-lg p-3 mt-3">
                          <p className="text-sm text-slate-300 font-medium">{task.submission.observation_title}</p>
                          <p className="text-xs text-slate-500 mt-1">Submission: {task.submission.status}</p>
                          {task.submission.review_notes && (
                            <p className="text-xs text-slate-500 mt-1">Note: {task.submission.review_notes}</p>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-2">
                      {task.status === 'assigned' && (
                        <Link
                          href={`/news/tasks/${task.id}/submit`}
                          className="px-4 py-2 bg-violet-500 hover:bg-violet-400 text-white font-semibold rounded-lg transition-colors text-center text-sm flex items-center gap-1"
                        >
                          <Edit3 className="w-4 h-4" /> Submit
                        </Link>
                      )}
                      {task.observation_id && (
                        <Link
                          href={`/observations/${task.observation_id}`}
                          className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors text-center text-sm"
                        >
                          View
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
