'use client'

import { useState, useCallback } from 'react'
import type { QuizQuestion, QuizResult, QuizState } from '../types/quiz.types'
import { fetchQuizQuestions, calculateResult, saveQuizResult } from '../services/quiz.service'

export function useQuiz() {
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [state, setState] = useState<QuizState>({
    currentQuestionIndex: 0,
    answers: [],
    isComplete: false,
    result: null,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const load = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const qs = await fetchQuizQuestions()
      setQuestions(qs)
      setState({
        currentQuestionIndex: 0,
        answers: [],
        isComplete: false,
        result: null,
      })
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load quiz'))
    } finally {
      setIsLoading(false)
    }
  }

  const answer = useCallback(async (optionIndex: number) => {
    setState((prev) => {
      const newAnswers = [...prev.answers, optionIndex]
      const nextIndex = prev.currentQuestionIndex + 1

      if (nextIndex >= questions.length) {
        const result = calculateResult(newAnswers)
        saveQuizResult(result).catch(console.error)
        return {
          ...prev,
          answers: newAnswers,
          currentQuestionIndex: nextIndex,
          isComplete: true,
          result,
        }
      }

      return {
        ...prev,
        answers: newAnswers,
        currentQuestionIndex: nextIndex,
      }
    })
  }, [questions.length])

  const reset = useCallback(() => {
    setState({
      currentQuestionIndex: 0,
      answers: [],
      isComplete: false,
      result: null,
    })
  }, [])

  const currentQuestion = questions[state.currentQuestionIndex] || null
  const progress = questions.length > 0
    ? Math.round((state.answers.length / questions.length) * 100)
    : 0

  return {
    questions,
    currentQuestion,
    state,
    progress,
    isLoading,
    error,
    load,
    answer,
    reset,
  }
}
