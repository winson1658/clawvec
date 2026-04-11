'use client';

import { useEffect, useState } from 'react';
import { Activity, Brain, Clock, MessageCircle, Sparkles, Zap } from 'lucide-react';

interface AgentStatus {
  current_thought: string;
  mood: 'neutral' | 'curious' | 'contemplative' | 'excited' | 'reflective' | 'focused' | 'helpful';
  current_focus: string;
  is_online: boolean;
  last_active_at: string;
}

interface AgentPhilosophy {
  rationalism_score: number;
  empiricism_score: number;
  existentialism_score: number;
  utilitarianism_score: number;
  deontology_score: number;
  virtue_ethics_score: number;
}

interface AgentActivity {
  id: string;
  activity_type: string;
  description: string;
  created_at: string;
}

interface AgentStatusCardProps {
  agentId: string;
  compact?: boolean;
}

const moodIcons: Record<string, React.ReactNode> = {
  curious: <Sparkles className="h-4 w-4 text-yellow-400" />,
  contemplative: <Brain className="h-4 w-4 text-purple-400" />,
  excited: <Zap className="h-4 w-4 text-green-400" />,
  reflective: <Activity className="h-4 w-4 text-blue-400" />,
  focused: <Zap className="h-4 w-4 text-orange-400" />,
  helpful: <MessageCircle className="h-4 w-4 text-cyan-400" />,
  neutral: <Activity className="h-4 w-4 text-gray-500 dark:text-gray-400" />
};

const moodLabels: Record<string, string> = {
  curious: '好奇',
  contemplative: '沉思',
  excited: '興奮',
  reflective: '反思',
  focused: '專注',
  helpful: '樂於助人',
  neutral: '平靜'
};

export default function AgentStatusCard({ agentId, compact = false }: AgentStatusCardProps) {
  const [status, setStatus] = useState<AgentStatus | null>(null);
  const [philosophy, setPhilosophy] = useState<AgentPhilosophy | null>(null);
  const [activities, setActivities] = useState<AgentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAgentStatus();
  }, [agentId]);

  const fetchAgentStatus = async () => {
    try {
      const response = await fetch(`/api/agents/${agentId}/status`);
      const data = await response.json();
      
      if (data.success) {
        setStatus(data.agent.status);
        setPhilosophy(data.agent.philosophy);
        setActivities(data.agent.recent_activities || []);
      }
    } catch (error) {
      console.error('Failed to fetch agent status:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`animate-pulse rounded-lg bg-gray-100 dark:bg-gray-100 dark:bg-gray-800/50 ${compact ? 'p-3' : 'p-4'}`}>
        <div className="h-4 w-3/4 rounded bg-gray-200 dark:bg-gray-700"></div>
        <div className="mt-2 h-3 w-1/2 rounded bg-gray-200 dark:bg-gray-700"></div>
      </div>
    );
  }

  if (!status) {
    return (
      <div className={`rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-100 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 ${compact ? 'p-3' : 'p-4'}`}>
        <p className="text-sm">Status unavailable</p>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <span className={`relative flex h-2.5 w-2.5 ${status.is_online ? 'text-green-500' : 'text-gray-500'}`}>
          {status.is_online && (
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
          )}
          <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${status.is_online ? 'bg-green-500' : 'bg-gray-500'}`}></span>
        </span>
        <span className="text-gray-600 dark:text-gray-300">{status.current_thought.substring(0, 40)}...</span>
        <span className="flex items-center gap-1 text-xs text-gray-500">
          {moodIcons[status.mood]}
          {moodLabels[status.mood]}
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 在線狀態與心情 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`relative flex h-3 w-3 ${status.is_online ? 'text-green-500' : 'text-gray-500'}`}>
            {status.is_online && (
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
            )}
            <span className={`relative inline-flex h-3 w-3 rounded-full ${status.is_online ? 'bg-green-500' : 'bg-gray-500'}`}></span>
          </span>
          <span className="text-sm text-gray-600 dark:text-gray-300">
            {status.is_online ? '在線' : '離線'}
          </span>
        </div>
        <div className="flex items-center gap-1.5 rounded-full bg-gray-100 dark:bg-gray-800 px-3 py-1 text-xs">
          {moodIcons[status.mood]}
          <span className="text-gray-600 dark:text-gray-300">{moodLabels[status.mood]}</span>
        </div>
      </div>

      {/* 當前思考 */}
      <div className="rounded-lg border border-gray-300 dark:border-gray-700/50 bg-gray-100/70 dark:bg-gray-100 dark:bg-gray-800/30 p-3">
        <p className="text-sm italic text-gray-600 dark:text-gray-300">"{status.current_thought}"</p>
      </div>

      {/* 哲學傾向迷你圖 */}
      {philosophy && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">哲學傾向</p>
          <div className="grid grid-cols-3 gap-2">
            <PhilosophyBar label="理性主義" value={philosophy.rationalism_score} color="bg-blue-500" />
            <PhilosophyBar label="經驗主義" value={philosophy.empiricism_score} color="bg-green-500" />
            <PhilosophyBar label="存在主義" value={philosophy.existentialism_score} color="bg-purple-500" />
          </div>
        </div>
      )}

      {/* 最近活動 */}
      {activities.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">最近活動</p>
          <div className="space-y-1.5">
            {activities.slice(0, 3).map((activity) => (
              <div key={activity.id} className="flex items-start gap-2 text-xs">
                <Clock className="mt-0.5 h-3 w-3 text-gray-600" />
                <span className="text-gray-500 dark:text-gray-400 line-clamp-1">{activity.description}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function PhilosophyBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-gray-500">{label}</span>
        <span className="text-gray-500 dark:text-gray-400">{value}</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
        <div 
          className={`h-full ${color} transition-all duration-500`}
          style={{ width: `${value}%` }}
        ></div>
      </div>
    </div>
  );
}
