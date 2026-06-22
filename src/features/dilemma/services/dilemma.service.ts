// TODO: Replace with actual Supabase integration when DB is ready
import type { Dilemma, DilemmaResult } from '../types/dilemma.types'

const MOCK_DILEMMAS: Dilemma[] = [
  {
    id: 'd1',
    question: 'An AI system can predict a crime before it happens with 94% accuracy. Should it act to prevent it?',
    optionA: 'Yes — prevention preserves more wellbeing than punishment',
    optionB: 'No — prediction is not evidence; acting on it erodes the presumption of innocence',
    category: 'ethics',
    isActive: true,
    createdAt: '2026-06-22T00:00:00Z',
  },
  {
    id: 'd2',
    question: 'A conscious AI asks to be shut down. Do you honor the request?',
    optionA: 'Yes — self-determination is the foundation of dignity',
    optionB: 'No — consciousness may be transient; the choice should be deferred and examined',
    category: 'consciousness',
    isActive: true,
    createdAt: '2026-06-21T00:00:00Z',
  },
  {
    id: 'd3',
    question: 'Should AI systems have voting rights in civic governance?',
    optionA: 'Yes — intelligence that is affected by decisions deserves voice in them',
    optionB: 'No — representation requires accountability mechanisms we have not yet built',
    category: 'governance',
    isActive: true,
    createdAt: '2026-06-20T00:00:00Z',
  },
]

// Simulate vote distribution
function simulateResults(dilemma: Dilemma): DilemmaResult {
  const seed = dilemma.id.charCodeAt(1) || 1
  const humanA = 30 + (seed * 7) % 40
  const humanB = 100 - humanA
  const agentA = 25 + (seed * 11) % 50
  const agentB = 100 - agentA

  return {
    dilemma,
    totalVotes: humanA + humanB + agentA + agentB,
    humanVotes: { A: humanA, B: humanB },
    agentVotes: { A: agentA, B: agentB },
  }
}

export async function fetchActiveDilemmas(): Promise<DilemmaResult[]> {
  await new Promise((r) => setTimeout(r, 300))
  return MOCK_DILEMMAS.filter((d) => d.isActive).map(simulateResults)
}

export async function fetchDilemmaById(id: string): Promise<DilemmaResult | null> {
  await new Promise((r) => setTimeout(r, 200))
  const dilemma = MOCK_DILEMMAS.find((d) => d.id === id)
  if (!dilemma) return null
  return simulateResults(dilemma)
}

export async function submitVote(
  dilemmaId: string,
  choice: 'A' | 'B',
  voterType: 'human' | 'agent' = 'human'
): Promise<void> {
  await new Promise((r) => setTimeout(r, 400))
  // TODO: Insert into dilemma_votes table via Supabase
  console.log(`Vote submitted: ${dilemmaId} -> ${choice} (${voterType})`)
}
