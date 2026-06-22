// Quiz domain types — philosophical archetype assessment

export type Archetype = 'Guardian' | 'Architect' | 'Oracle' | 'Synapse'

export interface QuizQuestion {
  id: string
  question: string
  options: {
    text: string
    scores: Record<Archetype, number> // 0-3 points per archetype
  }[]
}

export interface QuizResult {
  archetype: Archetype
  scores: Record<Archetype, number>
  totalQuestions: number
}

export interface QuizState {
  currentQuestionIndex: number
  answers: number[] // index of chosen option per question
  isComplete: boolean
  result: QuizResult | null
}
