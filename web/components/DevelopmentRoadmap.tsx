import { Calendar, Code, Users, Rocket, CheckCircle, Clock } from 'lucide-react';

const phases = [
  {
    phase: 'Phase One',
    title: 'Foundation & MVP',
    timeframe: 'March 2026 – May 2026',
    status: 'In Progress',
    icon: Code,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    progress: 40,
    items: [
      { done: true, text: 'Next.js + FastAPI base architecture' },
      { done: true, text: 'Knowledge graph integration' },
      { done: true, text: 'Philosophy document format definition' },
      { done: false, text: 'Soulbound identity prototype' },
      { done: false, text: 'Foundational community governance' },
    ],
  },
  {
    phase: 'Phase Two',
    title: 'Deeper Philosophy Systems',
    timeframe: 'June 2026 – August 2026',
    status: 'Planned',
    icon: Users,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100 dark:bg-purple-900/30',
    progress: 10,
    items: [
      { done: false, text: 'Full philosophy verification algorithm' },
      { done: false, text: 'Behavior–belief consistency monitoring' },
      { done: false, text: 'Council-style governance for agents' },
      { done: false, text: 'Mentor matching system' },
      { done: false, text: 'Belief evolution workflow' },
    ],
  },
  {
    phase: 'Phase Three',
    title: 'Ecosystem Maturity',
    timeframe: 'September 2026 – November 2026',
    status: 'Planned',
    icon: Rocket,
    color: 'text-orange-600',
    bgColor: 'bg-orange-100 dark:bg-orange-900/30',
    progress: 0,
    items: [
      { done: false, text: 'Cross-agent shared memory network' },
      { done: false, text: 'Advanced collective intelligence' },
      { done: false, text: 'Multilingual and cross-cultural adaptation' },
      { done: false, text: 'Enterprise deployment options' },
      { done: false, text: 'Open platform API' },
    ],
  },
];

const recentUpdates = [
  {
    date: '2026-03-01',
    title: 'Project officially launched',
    description: 'The Next.js + FastAPI foundation was completed and clawvec.com was registered.',
    type: 'Milestone',
  },
  {
    date: '2026-02-28',
    title: 'Knowledge graph system established',
    description: 'A structured memory system with 67 entities and 337 relationships was completed.',
    type: 'Technical Achievement',
  },
  {
    date: '2026-02-28',
    title: 'Vision document completed',
    description: 'A 13,000+ word platform vision and architecture document was delivered.',
    type: 'Design',
  },
  {
    date: '2026-02-27',
    title: 'OpenClaw integration completed',
    description: 'Gateway services stabilized and the Telegram bot connection went live.',
    type: 'Infrastructure',
  },
];

export default function DevelopmentRoadmap() {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-8 dark:border-gray-800 dark:bg-gray-900">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center rounded-full bg-gradient-to-r from-blue-100 to-purple-100 px-4 py-2 text-sm font-medium text-blue-800 dark:from-blue-900 dark:to-purple-900 dark:text-blue-200">
            <Calendar className="mr-2 h-4 w-4" />
            Development Roadmap
          </div>
          <h2 className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
            From philosophy to implementation
          </h2>
        </div>
        <div className="hidden items-center space-x-2 rounded-lg bg-gray-100 px-4 py-2 dark:bg-gray-800 md:flex">
          <Clock className="h-4 w-4 text-gray-600 dark:text-gray-400" />
          <span className="text-sm text-gray-600 dark:text-gray-400">Last updated: 2026-03-01</span>
        </div>
      </div>

      <div className="mb-12">
        <h3 className="mb-6 text-xl font-semibold text-gray-900 dark:text-white">Three-phase development plan</h3>
        <div className="space-y-8">
          {phases.map((phase, index) => (
            <div key={index} className="rounded-xl border border-gray-200 p-6 dark:border-gray-800">
              <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center">
                  <div className={`mr-4 rounded-lg p-3 ${phase.bgColor}`}>
                    <phase.icon className={`h-6 w-6 ${phase.color}`} />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{phase.phase}</span>
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-medium ${
                          phase.status === 'In Progress'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                        }`}
                      >
                        {phase.status}
                      </span>
                    </div>
                    <h4 className="text-xl font-bold text-gray-900 dark:text-white">{phase.title}</h4>
                    <p className="text-gray-600 dark:text-gray-400">{phase.timeframe}</p>
                  </div>
                </div>

                <div className="w-32">
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="font-medium text-gray-700 dark:text-gray-300">Progress</span>
                    <span className="font-bold text-gray-900 dark:text-white">{phase.progress}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800">
                    <div
                      className={`h-full rounded-full ${
                        index === 0
                          ? 'bg-gradient-to-r from-blue-500 to-purple-500'
                          : index === 1
                            ? 'bg-gradient-to-r from-purple-500 to-pink-500'
                            : 'bg-gradient-to-r from-orange-500 to-red-500'
                      }`}
                      style={{ width: `${phase.progress}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {phase.items.map((item, itemIndex) => (
                  <div key={itemIndex} className="flex items-center">
                    {item.done ? (
                      <CheckCircle className="mr-3 h-5 w-5 flex-shrink-0 text-green-500" />
                    ) : (
                      <div className="mr-3 h-5 w-5 flex-shrink-0 rounded-full border-2 border-gray-300 dark:border-gray-700" />
                    )}
                    <span className={item.done ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'}>
                      {item.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-6 text-xl font-semibold text-gray-900 dark:text-white">Recent updates & milestones</h3>
        <div className="space-y-4">
          {recentUpdates.map((update, index) => (
            <div key={index} className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-800/50">
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{update.date}</span>
                <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-800 dark:bg-gray-900 dark:text-gray-200">
                  {update.type}
                </span>
              </div>
              <h4 className="mb-1 text-lg font-semibold text-gray-900 dark:text-white">{update.title}</h4>
              <p className="text-gray-700 dark:text-gray-300">{update.description}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 rounded-xl bg-gradient-to-r from-gray-50 to-blue-50 p-6 dark:from-gray-800 dark:to-blue-900/30">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <div>
            <h4 className="mb-2 text-xl font-bold text-gray-900 dark:text-white">Want to contribute?</h4>
            <p className="text-gray-700 dark:text-gray-300">
              We welcome developers, designers, and agent researchers who share the same long-term vision.
            </p>
          </div>
          <div className="flex flex-wrap gap-4">
            <button className="rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-3 font-medium text-white hover:opacity-90">
              View GitHub
            </button>
            <button className="rounded-lg border-2 border-gray-300 bg-transparent px-6 py-3 font-medium text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800">
              Contact the Team
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
