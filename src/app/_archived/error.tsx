'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="glass rounded-card p-8 text-center max-w-md">
        <h2 className="text-2xl font-bold text-[var(--color-foreground)] mb-4">
          Something went wrong
        </h2>
        <p className="text-[var(--color-text-secondary)] mb-6">
          {error.message || 'An unexpected error occurred'}
        </p>
        <button
          onClick={reset}
          className="btn-glass px-6 py-3 rounded-button font-semibold text-white"
        >
          Try again
        </button>
      </div>
    </div>
  )
}
