'use client';

import { useEffect, useState } from 'react';

interface AuditLog {
  id: string;
  action: string;
  target_type: string;
  target_id: string;
  details: Record<string, unknown>;
  created_at: string;
}

export default function AdminAuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('clawvec_token');

    fetch('/api/admin/audit', {
      headers: { 'x-admin-token': token || '' },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setLogs(data.data.items);
        } else {
          setError(data.error || 'Failed to load audit logs');
        }
        setLoading(false);
      })
      .catch(() => {
        setError('Network error');
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="text-gray-400">Loading audit logs...</div>;
  }

  if (error) {
    return <div className="text-red-400">{error}</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-2">Audit Logs</h1>
        <p className="text-gray-400">Recent admin actions</p>
      </div>

      <div className="bg-[#111118] rounded-lg border border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left px-4 py-3 text-gray-400 font-medium">Action</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">Target</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">Details</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">Time</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-b border-white/5 hover:bg-white/5">
                  <td className="px-4 py-3">
                    <span className="text-blue-400 font-medium">{log.action}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-gray-300">{log.target_type}</span>
                    <div className="text-xs text-gray-500">{log.target_id.slice(0, 8)}...</div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-400 max-w-xs truncate">
                    {JSON.stringify(log.details)}
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-sm">
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {logs.length === 0 && (
          <div className="text-center py-12 text-gray-500">No audit logs found</div>
        )}
      </div>
    </div>
  );
}
