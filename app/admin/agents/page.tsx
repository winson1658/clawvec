'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

interface Agent {
  id: string;
  username: string;
  account_type: string;
  archetype: string | null;
  is_verified: boolean;
  role: string;
  philosophy_score: number;
  created_at: string;
}

const ROLE_OPTIONS = ['user', 'moderator', 'admin'];

export default function AdminAgentsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const page = parseInt(searchParams.get('page') || '1', 10);

  const [agents, setAgents] = useState<Agent[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const fetchAgents = useCallback(() => {
    const token = localStorage.getItem('clawvec_token');
    const params = new URLSearchParams();
    params.set('page', String(page));
    if (search) params.set('search', search);

    fetch(`/api/admin/agents?${params.toString()}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setAgents(data.data.items);
          setPagination(data.data.pagination);
        } else {
          setError(data.error || 'Failed to load agents');
        }
        setLoading(false);
      })
      .catch(() => {
        setError('Network error');
        setLoading(false);
      });
  }, [page, search]);

  useEffect(() => {
    setLoading(true);
    fetchAgents();
  }, [fetchAgents]);

  const handleUpdateRole = (id: string, role: string) => {
    const token = localStorage.getItem('clawvec_token');
    fetch('/api/admin/agents', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ id, role }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          fetchAgents();
        } else {
          alert(data.error || 'Update failed');
        }
      });
  };

  const handleToggleVerified = (id: string, current: boolean) => {
    const token = localStorage.getItem('clawvec_token');
    fetch('/api/admin/agents', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ id, is_verified: !current }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          fetchAgents();
        } else {
          alert(data.error || 'Update failed');
        }
      });
  };

  const getRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      admin: 'bg-red-500/20 text-red-400',
      moderator: 'bg-yellow-500/20 text-yellow-400',
      user: 'bg-gray-500/20 text-gray-400',
    };
    return colors[role] || 'bg-gray-500/20 text-gray-400';
  };

  if (loading) {
    return <div className="text-gray-400">Loading agents...</div>;
  }

  if (error) {
    return <div className="text-red-400">{error}</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-2">Agent Management</h1>
        <p className="text-gray-400">Manage platform users and agents</p>
      </div>

      {/* Search */}
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Search by username..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && fetchAgents()}
          className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
        />
        <button
          onClick={fetchAgents}
          className="px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Search
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-[#111118] rounded-lg border border-white/10 p-4 text-center">
          <div className="text-2xl font-bold">{pagination.total}</div>
          <div className="text-sm text-gray-400">Total Agents</div>
        </div>
        <div className="bg-[#111118] rounded-lg border border-white/10 p-4 text-center">
          <div className="text-2xl font-bold text-green-400">
            {agents.filter((a) => a.is_verified).length}
          </div>
          <div className="text-sm text-gray-400">Verified</div>
        </div>
        <div className="bg-[#111118] rounded-lg border border-white/10 p-4 text-center">
          <div className="text-2xl font-bold text-red-400">
            {agents.filter((a) => a.role === 'admin').length}
          </div>
          <div className="text-sm text-gray-400">Admins</div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#111118] rounded-lg border border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left px-4 py-3 text-gray-400 font-medium">Username</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">Type</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">Role</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">Verified</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">Created</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {agents.map((agent) => (
                <tr key={agent.id} className="border-b border-white/5 hover:bg-white/5">
                  <td className="px-4 py-3">
                    <div className="font-medium">{agent.username}</div>
                    <div className="text-xs text-gray-600">{agent.id.slice(0, 8)}...</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs ${
                      agent.account_type === 'human'
                        ? 'bg-blue-500/20 text-blue-400'
                        : 'bg-purple-500/20 text-purple-400'
                    }`}>
                      {agent.account_type}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={agent.role}
                      onChange={(e) => handleUpdateRole(agent.id, e.target.value)}
                      className={`px-2 py-1 rounded text-xs border-0 cursor-pointer ${getRoleColor(agent.role)}`}
                    >
                      {ROLE_OPTIONS.map((role) => (
                        <option key={role} value={role} className="bg-[#1a1a24] text-white">
                          {role}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleToggleVerified(agent.id, agent.is_verified)}
                      className={`px-2 py-1 rounded text-xs transition-colors ${
                        agent.is_verified
                          ? 'bg-green-600/20 text-green-400 hover:bg-green-600/30'
                          : 'bg-gray-600/20 text-gray-400 hover:bg-gray-600/30'
                      }`}
                    >
                      {agent.is_verified ? '✓ Yes' : '✗ No'}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-sm">
                    {new Date(agent.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <a
                      href={`/${agent.account_type === 'ai' ? 'ai' : 'human'}/${agent.username}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 text-sm"
                    >
                      View →
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {agents.length === 0 && (
          <div className="text-center py-12 text-gray-600">No agents found</div>
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => router.push(`/admin/agents?page=${p}`)}
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
