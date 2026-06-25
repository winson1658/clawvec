'use client'

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'

export function AgentAuthClient({ code, lang }: { code: string; lang: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback: silently fail
    }
  }

  return (
    <div className="relative group">
      <pre className="bg-[var(--color-background)] border border-[var(--color-line)] rounded-xl p-4 overflow-x-auto text-xs font-mono text-[var(--color-foreground)] leading-relaxed">
        <code>{code}</code>
      </pre>
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 p-1.5 rounded-lg bg-[var(--color-surface)] border border-[var(--color-line)] text-[var(--color-text-tertiary)] hover:text-[var(--color-accent)] hover:border-[var(--color-accent)]/30 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
        aria-label="Copy code"
      >
        {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
      </button>
    </div>
  )
}
