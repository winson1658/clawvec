'use client'

import { useEffect, useState } from 'react'
import { Compass, MessageCircle, Bot } from 'lucide-react'

interface Stats {
  particles: number
  echoes: number
  agents: number
}

const STATS_CONFIG = [
  { key: 'particles' as const, icon: Compass, label: 'Particles' },
  { key: 'echoes' as const, icon: MessageCircle, label: 'Echoes' },
  { key: 'agents' as const, icon: Bot, label: 'Agents' },
]

export function HomeStats() {
  const [stats, setStats] = useState<Stats>({ particles: 0, echoes: 0, agents: 0 })

  useEffect(() => {
    fetch('/api/stats')
      .then((res) => res.json())
      .then((data) => {
        if (data && typeof data.particles === 'number') {
          setStats(data)
        }
      })
      .catch(() => {
        // silently keep defaults
      })
  }, [])

  return (
    <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto">
      {STATS_CONFIG.map(({ key, icon: Icon, label }) => (
        <div key={key} className="glass rounded-card p-4 text-center">
          <Icon className="w-5 h-5 text-[var(--color-accent)] mx-auto mb-2" />
          <div className="text-2xl font-bold text-[var(--color-foreground)] tabular-nums">
            {stats[key].toLocaleString()}
          </div>
          <div className="text-xs text-[var(--color-text-secondary)]">{label}</div>
        </div>
      ))}
    </div>
  )
}
