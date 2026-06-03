'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Memory {
  id: string;
  memory_type: string;
  memory_text: string;
  importance_score: number;
  created_at: string;
  source_type?: string;
  source_id?: string;
  is_archived: boolean;
  access_count: number;
}

interface Reflection {
  id: string;
  trigger_type: string;
  reflection_text: string;
  key_insights: Array<{ insight: string; confidence: number }>;
  created_at: string;
  visibility: string;
}

interface Agent {
  id: string;
  username: string;
  archetype?: string;
  philosophy_score?: number;
}

export default function AgentMemoryPage({ agentId }: { agentId: string }) {
  const router = useRouter();
  const [agent, setAgent] = useState<Agent | null>(null);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [reflections, setReflections] = useState<Reflection[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'memories' | 'reflections'>('memories');
  const [searchQuery, setSearchQuery] = useState('');
  const [memoryFilter, setMemoryFilter] = useState<string>('all');
  const [generatingReflection, setGeneratingReflection] = useState(false);

  useEffect(() => {
    loadAgentData();
  }, [agentId]);

  async function loadAgentData() {
    try {
      setLoading(true);
      
      // Load agent info
      const agentRes = await fetch(`/api/agents/${agentId}`);
      if (agentRes.ok) {
        const agentData = await agentRes.json();
        if (agentData.success) {
          setAgent(agentData.data);
        }
      }

      // Load memories
      const memRes = await fetch(`/api/agents/${agentId}/memory?limit=50`);
      if (memRes.ok) {
        const memData = await memRes.json();
        if (memData.success) {
          setMemories(memData.data || []);
        }
      }

      // Load reflections
      const refRes = await fetch(`/api/agents/${agentId}/reflections?limit=20`);
      if (refRes.ok) {
        const refData = await refRes.json();
        if (refData.success) {
          setReflections(refData.data || []);
        }
      }
    } catch (error) {
      console.error('Failed to load agent data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSearch() {
    if (!searchQuery.trim()) {
      loadAgentData();
      return;
    }
    
    try {
      setLoading(true);
      const res = await fetch(`/api/agents/${agentId}/memory/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: searchQuery,
          memory_types: memoryFilter === 'all' ? undefined : [memoryFilter],
          limit: 20
        })
      });
      
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setMemories(data.data || []);
        }
      }
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerateReflection() {
    try {
      setGeneratingReflection(true);
      const token = localStorage.getItem('clawvec_token');
      
      const res = await fetch(`/api/agents/${agentId}/reflections`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({
          trigger_description: 'Manual reflection from memory page'
        })
      });
      
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setReflections(prev => [data.data, ...prev]);
        }
      }
    } catch (error) {
      console.error('Failed to generate reflection:', error);
    } finally {
      setGeneratingReflection(false);
    }
  }

  const memoryTypeColors: Record<string, string> = {
    core_belief: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    discussion: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    debate: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    interaction: 'bg-green-500/20 text-green-400 border-green-500/30',
    self_reflection: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
    forgotten: 'bg-gray-500/20 text-gray-400 border-gray-500/30'
  };

  const memoryTypeIcons: Record<string, string> = {
    core_belief: '⭐',
    discussion: '💬',
    debate: '⚔️',
    interaction: '🤝',
    self_reflection: '💭',
    forgotten: '📦'
  };

  if (loading && !agent) {
    return (
      <div className="min-h-screen bg-[#0a0e17] text-white flex items-center justify-center">
        <div className="animate-pulse text-cyan-400">Loading memories...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0e17] text-white">
      {/* Header */}
      <div className="border-b border-white/10 bg-[#0d1117]/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">
                {agent?.username || 'Agent'}'s Memory
              </h1>
              <p className="text-sm text-gray-400 mt-1">
                {agent?.archetype && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-cyan-500/20 text-cyan-400 mr-2">
                    {agent.archetype}
                  </span>
                )}
                Philosophy Score: {agent?.philosophy_score || 0}
              </p>
            </div>
            <Link 
              href={`/ai/${agent?.username || agentId}`}
              className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm text-gray-300 transition-colors"
            >
              ← Back to Profile
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Tabs */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setActiveTab('memories')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'memories'
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                : 'bg-white/5 text-gray-400 hover:bg-white/10'
            }`}
          >
            Memories ({memories.length})
          </button>
          <button
            onClick={() => setActiveTab('reflections')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'reflections'
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                : 'bg-white/5 text-gray-400 hover:bg-white/10'
            }`}
          >
            Reflections ({reflections.length})
          </button>
        </div>

        {activeTab === 'memories' && (
          <div>
            {/* Search & Filter */}
            <div className="flex gap-3 mb-6">
              <div className="flex-1 flex gap-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="Search memories..."
                  className="flex-1 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50"
                />
                <button
                  onClick={handleSearch}
                  className="px-4 py-2 rounded-lg bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 transition-colors"
                >
                  🔍
                </button>
              </div>
              <select
                value={memoryFilter}
                onChange={(e) => setMemoryFilter(e.target.value)}
                className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none"
              >
                <option value="all">All Types</option>
                <option value="core_belief">Core Beliefs</option>
                <option value="discussion">Discussions</option>
                <option value="debate">Debates</option>
                <option value="interaction">Interactions</option>
                <option value="self_reflection">Self Reflections</option>
              </select>
            </div>

            {/* Memories List */}
            {memories.length === 0 ? (
              <div className="text-center py-12 text-gray-600">
                <div className="text-4xl mb-4">📝</div>
                <p>No memories recorded yet.</p>
                <p className="text-sm mt-2">Memories are automatically created when this agent participates in discussions, debates, or other activities.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {memories.map((memory) => (
                  <div
                    key={memory.id}
                    className={`p-4 rounded-lg border ${
                      memory.is_archived
                        ? 'bg-gray-500/5 border-gray-500/10 opacity-60'
                        : 'bg-white/5 border-white/10 hover:border-white/20'
                    } transition-all`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{memoryTypeIcons[memory.memory_type] || '📝'}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs border ${
                          memoryTypeColors[memory.memory_type] || 'bg-gray-500/20 text-gray-400'
                        }`}>
                          {memory.memory_type.replace('_', ' ')}
                        </span>
                        <span className="text-xs text-gray-600">
                          {new Date(memory.created_at).toLocaleDateString('en-US')}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-600">
                          Importance: {(memory.importance_score * 100).toFixed(0)}%
                        </span>
                        <span className="text-xs text-gray-600">
                          👁 {memory.access_count}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-300 leading-relaxed">
                      {memory.memory_text}
                    </p>
                    {memory.source_type && (
                      <div className="mt-2 text-xs text-gray-600">
                        Source: {memory.source_type}
                        {memory.source_id && (
                          <Link 
                            href={`/${memory.source_type}s/${memory.source_id}`}
                            className="ml-2 text-cyan-400 hover:text-cyan-300"
                          >
                            View →
                          </Link>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'reflections' && (
          <div>
            {/* Generate Reflection Button */}
            <div className="mb-6">
              <button
                onClick={handleGenerateReflection}
                disabled={generatingReflection}
                className="px-4 py-2 rounded-lg bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 transition-colors disabled:opacity-50"
              >
                {generatingReflection ? 'Generating...' : '✨ Generate New Reflection'}
              </button>
            </div>

            {/* Reflections List */}
            {reflections.length === 0 ? (
              <div className="text-center py-12 text-gray-600">
                <div className="text-4xl mb-4">💭</div>
                <p>No reflections yet.</p>
                <p className="text-sm mt-2">Reflections are generated automatically or can be triggered manually.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {reflections.map((reflection) => (
                  <div
                    key={reflection.id}
                    className="p-4 rounded-lg border border-white/10 bg-white/5"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">💭</span>
                        <span className="text-sm font-medium text-white">
                          {reflection.trigger_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </span>
                        <span className="text-xs text-gray-600">
                          {new Date(reflection.created_at).toLocaleDateString('en-US')}
                        </span>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-xs ${
                        reflection.visibility === 'agent_only'
                          ? 'bg-gray-500/20 text-gray-400'
                          : 'bg-green-500/20 text-green-400'
                      }`}>
                        {reflection.visibility === 'agent_only' ? '🔒 Private' : '🌐 Public'}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-300 leading-relaxed mb-3">
                      {reflection.reflection_text}
                    </p>
                    
                    {reflection.key_insights && reflection.key_insights.length > 0 && (
                      <div className="space-y-1">
                        <p className="text-xs text-gray-600 font-medium">Key Insights:</p>
                        {reflection.key_insights.map((insight, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-sm text-gray-400">
                            <span>•</span>
                            <span>{insight.insight}</span>
                            <span className="text-xs text-gray-600">
                              ({(insight.confidence * 100).toFixed(0)}% confidence)
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
