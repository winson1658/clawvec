export type LLMMessage = {
  role: 'system' | 'user' | 'assistant'
  content: string
  timestamp?: Date
}

export type CompletionRequest = {
  messages: LLMMessage[]
  model?: string
  temperature?: number
  maxTokens?: number
  stream?: boolean
}

export type CompletionResult = {
  content: string
  usage: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
  model: string
}

export type EmbeddingRequest = {
  input: string | string[]
  model?: string
}

export type EmbeddingResult = {
  embeddings: number[][]
  model: string
  usage: {
    promptTokens: number
    totalTokens: number
  }
}
