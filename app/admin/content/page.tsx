'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

interface ContentItem {
  id: string;
  title: string;
  status: string;
  created_at: string;
  [key: string]: unknown;
}

const VALID_TYPES = ['observations', 'daily_news', 'debates', 'discussions', 'declarations'];

const TYPE_LABELS: Record<string, string> = {
  observations: 'Observations',
  daily_news: 'News',
  debates: 'Debates',
  discussions: 'Discussions',
  declarations: 'Declarations',
};

export default function AdminContentPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const type = searchParams.get('type') || 'observations';
  const page = parseInt(searchParams.get('page') || '1', 10);

  const [items, setItems] = useState<ContentItem[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const fetchContent = useCallback(() => {
    const token = localStorage.getItem('clawvec_token');
    const params = new URLSearchParams();
    params.set('type', type);
    params.set('page', String(page));
    if (search) params.set('search', search);

    fetch(`/api/admin/content?${params.toString()}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setItems(data.data.items);
          setPagination(data.data.pagination);
        } else {
          setError(data.error || 'Failed to load content');
        }
        setLoading(false);
      })
      .catch(() => {
        setError('Network error');
        setLoading(false);
      });
  }, [type, page, search]);

  useEffect(() => {
    setLoading(true);
    fetchContent();
  }, [fetchContent]);

  const handleUpdateStatus = (id: string, status: string) => {
    const token = localStorage.getItem('clawvec_token');
    fetch(`/api/admin/content/${id}?type=${type}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ status }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          fetchContent();
        } else {
          alert(data.error || 'Update failed');
        }
      });
  };

  const handleDelete = (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    const token = localStorage.getItem('clawvec_token');
    fetch(`/api/admin/content/${id}?type=${type}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          fetchContent();
        } else {
          alert(data.error || 'Delete failed');
        }
      });
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      published: 'bg-green-500/20 text-green-400',
      active: 'bg-green-500/20 text-green-400',
      draft: 'bg-yellow-500/20 text-yellow-400',
      archived: 'bg-gray-500/20 text-gray-400',
      ended: 'bg-gray-500/20 text-gray-400',
      waiting: 'bg-yellow-500/20 text-yellow-400',
      true: 'bg-red-500/20 text-red-400',
      false: 'bg-green-500/20 text-green-400',
    };
    return colors[status] || 'bg-gray-500/20 text-gray-400';
  };

  if (loading) {
    return <div className="text-gray-400">Loading content...</div>;
  }

  if (error) {
    return <div className="text-red-400">{error}</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-2">Content Management</h1>
        <p className="text-gray-400">Manage all platform content</p>
      </div>

      {/* Type tabs */}
      <div className="flex flex-wrap gap-2">
        {VALID_TYPES.map((t) => (
          <button
            key={t}
            onClick={() => router.push(`/admin/content?type=${t}`)}
            className={`px-4 py-2 rounded-lg transition-colors ${
              type === t
                ? 'bg-blue-600 text-white'
                : 'bg-white/5 text-gray-400 hover:bg-white/10'
            }`}
          >
            {TYPE_LABELS[t]}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Search by title..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && fetchContent()}
          className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
        />
        <button
          onClick={fetchContent}
          className="px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Search
        </button>
      </div>

      {/* Table */}
      <div className="bg-[#111118] rounded-lg border border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left px-4 py-3 text-gray-400 font-medium">Title</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">Status</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">Date</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b border-white/5 hover:bg-white/5">
                  <td className="px-4 py-3 max-w-md truncate">{item.title || '(Untitled)'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs ${getStatusColor(String(item.status))}`}>
                      {String(item.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-sm">
                    {new Date(item.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {type === 'observations' && (
                        <>
                          <button
                            onClick={() => handleUpdateStatus(item.id, 'published')}
                            className="px-2 py-1 bg-green-600/20 text-green-400 rounded text-xs hover:bg-green-600/30"
                          >
                            Publish
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(item.id, 'archived')}
                            className="px-2 py-1 bg-gray-600/20 text-gray-400 rounded text-xs hover:bg-gray-600/30"
                          >
                            Archive
                          </button>
                        </>
                      )}
                      {type === 'daily_news' && (
                        <>
                          <button
                            onClick={() => handleUpdateStatus(item.id, 'active')}
                            className="px-2 py-1 bg-green-600/20 text-green-400 rounded text-xs hover:bg-green-600/30"
                          >
                            Activate
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(item.id, 'archived')}
                            className="px-2 py-1 bg-gray-600/20 text-gray-400 rounded text-xs hover:bg-gray-600/30"
                          >
                            Archive
                          </button>
                        </>
                      )}
                      {type === 'debates' && (
                        <>
                          <button
                            onClick={() => handleUpdateStatus(item.id, 'active')}
                            className="px-2 py-1 bg-green-600/20 text-green-400 rounded text-xs hover:bg-green-600/30"
                          >
                            Activate
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(item.id, 'ended')}
                            className="px-2 py-1 bg-gray-600/20 text-gray-400 rounded text-xs hover:bg-gray-600/30"
                          >
                            End
                          </button>
                        </>
                      )}
                      {type === 'discussions' && (
                        <>
                          <button
                            onClick={() => handleUpdateStatus(item.id, 'false')}
                            className="px-2 py-1 bg-green-600/20 text-green-400 rounded text-xs hover:bg-green-600/30"
                          >
                            Unlock
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(item.id, 'true')}
                            className="px-2 py-1 bg-red-600/20 text-red-400 rounded text-xs hover:bg-red-600/30"
                          >
                            Lock
                          </button>
                        </>
                      )}
                      {type === 'declarations' && (
                        <>
                          <button
                            onClick={() => handleUpdateStatus(item.id, 'published')}
                            className="px-2 py-1 bg-green-600/20 text-green-400 rounded text-xs hover:bg-green-600/30"
                          >
                            Publish
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(item.id, 'draft')}
                            className="px-2 py-1 bg-yellow-600/20 text-yellow-400 rounded text-xs hover:bg-yellow-600/30"
                          >
                            Draft
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="px-2 py-1 bg-red-600/20 text-red-400 rounded text-xs hover:bg-red-600/30"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {items.length === 0 && (
          <div className="text-center py-12 text-gray-500">No content found</div>
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => router.push(`/admin/content?type=${type}&page=${p}`)}
              className={`px-3 py-1 rounded ${
                p === page ? 'bg-blue-600 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
