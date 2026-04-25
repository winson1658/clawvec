import { Network, Database, GitBranch, Target, Filter, Search } from 'lucide-react';

const graphStats = {
  entities: 67,
  relations: 337,
  entityTypes: ['Person', 'Task', 'Event', 'Project'],
  relationTypes: ['assists', 'contains_task', 'has_task', 'involves', 'learns_about', 'precedes'],
  lastUpdated: '2026-02-28 22:30',
};

const sampleEntities = [
  {
    id: 'person_founder',
    type: 'Person',
    label: 'Winson Pan',
    properties: {
      title: 'Platform Founder',
      timezone: 'Asia/Taipei',
      role: 'Vision Steward',
    },
    relations: 24,
  },
  {
    id: 'agent_hermes',
    type: 'Person',
    label: 'Hermes',
    properties: {
      title: 'AI Assistant',
      emoji: '✨',
      role: 'Technical Builder',
    },
    relations: 18,
  },
  {
    id: 'project_telegram',
    type: 'Project',
    label: 'Telegram Bot Setup',
    properties: {
      status: 'completed',
      priority: 'high',
      start_date: '2026-02-28',
    },
    relations: 12,
  },
  {
    id: 'task_visualization',
    type: 'Task',
    label: 'Knowledge Graph Visualizer',
    properties: {
      status: 'in_progress',
      priority: 'high',
      complexity: 'medium',
    },
    relations: 15,
  },
];

const relationExamples = [
  {
    from: 'person_founder',
    to: 'agent_hermes',
    type: 'has_assistant',
    description: 'Founder-to-assistant relationship',
  },
  {
    from: 'project_telegram',
    to: 'task_visualization',
    type: 'contains_task',
    description: 'Project contains task',
  },
  {
    from: 'agent_hermes',
    to: 'task_visualization',
    type: 'assists',
    description: 'Assistant supports implementation',
  },
  {
    from: 'task_visualization',
    to: 'project_telegram',
    type: 'precedes',
    description: 'Sequencing in the overall timeline',
  },
];

export default function KnowledgeGraphPreview() {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-8 dark:border-gray-800 dark:bg-gray-900">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center rounded-full bg-gradient-to-r from-green-100 to-blue-100 px-4 py-2 text-sm font-medium text-green-800 dark:from-green-900 dark:to-blue-900 dark:text-green-200">
            <Network className="mr-2 h-4 w-4" />
            Structured Memory System
          </div>
          <h2 className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">From logs to a living knowledge graph</h2>
        </div>
        <div className="hidden items-center space-x-2 rounded-lg bg-gray-100 px-4 py-2 dark:bg-gray-800 md:flex">
          <Database className="h-4 w-4 text-gray-600 dark:text-gray-400" />
          <span className="text-sm text-gray-600 dark:text-gray-400">Real-time sync · automatic relationship discovery</span>
        </div>
      </div>

      <div className="mb-12">
        <h3 className="mb-6 text-xl font-semibold text-gray-900 dark:text-white">Graph snapshot</h3>
        <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
          <StatCard icon={<Database className="h-5 w-5 text-blue-600 dark:text-blue-300" />} value={graphStats.entities} label="Entities" sublabel="Agents, tasks, events, and projects" />
          <StatCard icon={<GitBranch className="h-5 w-5 text-purple-600 dark:text-purple-300" />} value={graphStats.relations} label="Relations" sublabel="Discovered connections across the system" />
          <StatCard icon={<Target className="h-5 w-5 text-green-600 dark:text-green-300" />} value={graphStats.entityTypes.length} label="Entity Types" sublabel={graphStats.entityTypes.join(', ')} />
          <StatCard icon={<Filter className="h-5 w-5 text-orange-600 dark:text-orange-300" />} value={graphStats.lastUpdated} label="Last Updated" sublabel="Continuously refreshed" smallValue />
        </div>
      </div>

      <div className="mb-12">
        <h3 className="mb-6 text-xl font-semibold text-gray-900 dark:text-white">Sample entities</h3>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {sampleEntities.map((entity) => (
            <div key={entity.id} className="rounded-xl border border-gray-200 p-4 hover:border-blue-300 dark:border-gray-800 dark:hover:border-blue-700">
              <div className="mb-4 flex items-center justify-between gap-4">
                <div className="flex items-center">
                  <div className={`mr-3 rounded-lg p-2 ${entity.type === 'Person' ? 'bg-blue-100 dark:bg-blue-900' : entity.type === 'Task' ? 'bg-green-100 dark:bg-green-900' : 'bg-purple-100 dark:bg-purple-900'}`}>
                    <span className={`text-sm font-medium ${entity.type === 'Person' ? 'text-blue-600 dark:text-blue-300' : entity.type === 'Task' ? 'text-green-600 dark:text-green-300' : 'text-purple-600 dark:text-purple-300'}`}>
                      {entity.type.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">{entity.label}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">ID: {entity.id}</p>
                  </div>
                </div>
                <div className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                  {entity.relations} links
                </div>
              </div>

              <div className="mb-4">
                <div className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Properties</div>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(entity.properties).map(([key, value]) => (
                    <div key={key} className="rounded-full bg-gray-100 px-3 py-1 text-xs dark:bg-gray-800">
                      <span className="font-medium text-gray-700 dark:text-gray-300">{key}:</span>{' '}
                      <span className="text-gray-600 dark:text-gray-400">{value.toString()}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="text-right">
                <button className="text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
                  View full relations →
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-8">
        <h3 className="mb-6 text-xl font-semibold text-gray-900 dark:text-white">Relationship examples</h3>
        <div className="space-y-4">
          {relationExamples.map((relation, index) => (
            <div key={index} className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-800/50">
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-purple-500">
                  <Network className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center">
                    <span className="font-medium text-gray-900 dark:text-white">{relation.from}</span>
                    <div className="mx-3 h-px w-8 bg-gray-300 dark:bg-gray-700" />
                    <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-200">{relation.type}</span>
                    <div className="mx-3 h-px w-8 bg-gray-300 dark:bg-gray-700" />
                    <span className="font-medium text-gray-900 dark:text-white">{relation.to}</span>
                  </div>
                  <p className="mt-2 text-gray-700 dark:text-gray-300">{relation.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl bg-gradient-to-r from-green-50 to-blue-50 p-6 dark:from-green-900/30 dark:to-blue-900/30">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          <FeatureColumn
            title="Graph Querying"
            items={[
              { icon: <Search className="mr-3 h-5 w-5 text-gray-600 dark:text-gray-400" />, text: 'Semantic search and keyword lookup' },
              { icon: <Filter className="mr-3 h-5 w-5 text-gray-600 dark:text-gray-400" />, text: 'Multi-dimensional filters' },
              { icon: <GitBranch className="mr-3 h-5 w-5 text-gray-600 dark:text-gray-400" />, text: 'Relationship path exploration' },
            ]}
          />
          <FeatureColumn
            title="Automation"
            items={[
              { icon: <Dot color="bg-green-500" />, text: 'Real-time memory ingestion' },
              { icon: <Dot color="bg-blue-500" />, text: 'Automatic relationship discovery' },
              { icon: <Dot color="bg-purple-500" />, text: 'Duplicate detection and merging' },
            ]}
          />
          <div>
            <h4 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Coming next</h4>
            <div className="space-y-3">
              <MiniCard title="Belief graph expansion" description="Extend the current knowledge graph into a richer philosophy graph." />
              <MiniCard title="Interactive visualization" description="Drag, zoom, and filter through the graph in a dedicated browser." />
              <MiniCard title="API integration" description="Expose graph-aware queries to the broader Clawvec platform." />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, value, label, sublabel, smallValue = false }: { icon: React.ReactNode; value: string | number; label: string; sublabel: string; smallValue?: boolean }) {
  return (
    <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
      <div className="mb-2 flex items-center">
        <div className="mr-3 rounded-lg bg-gray-100 p-2 dark:bg-gray-800">{icon}</div>
        <div className={`${smallValue ? 'text-sm' : 'text-2xl'} font-bold text-gray-900 dark:text-white`}>{value}</div>
      </div>
      <div className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</div>
      <div className="text-xs text-gray-600 dark:text-gray-400">{sublabel}</div>
    </div>
  );
}

function FeatureColumn({ title, items }: { title: string; items: { icon: React.ReactNode; text: string }[] }) {
  return (
    <div>
      <h4 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">{title}</h4>
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.text} className="flex items-center">
            {item.icon}
            <span className="text-gray-700 dark:text-gray-300">{item.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Dot({ color }: { color: string }) {
  return (
    <div className={`mr-3 h-5 w-5 rounded-full bg-gray-100 p-1 dark:bg-gray-900`}>
      <div className={`h-3 w-3 rounded-full ${color}`} />
    </div>
  );
}

function MiniCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-lg bg-white/50 p-3 dark:bg-gray-800/50">
      <div className="text-sm font-medium text-gray-900 dark:text-white">{title}</div>
      <div className="text-xs text-gray-600 dark:text-gray-400">{description}</div>
    </div>
  );
}
