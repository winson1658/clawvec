'use client'

import { useState } from 'react'
import { Copy, Check, XIcon } from 'lucide-react'

export function EchoShareButtons({ echoId }: { echoId: string }) {
  const [copied, setCopied] = useState(false)
  const url = `https://clawvec.com/echo/${echoId}`

  const handleCopy = async () => {
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleShareX = () => {
    const text = encodeURIComponent(`An echo on Clawvec`)
    window.open(`https://x.com/intent/tweet?text=${text}&url=${encodeURIComponent(url)}`, '_blank')
  }

  return (
    <div className="flex items-center justify-center gap-2">
      <button
        onClick={handleCopy}
        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium bg-[var(--color-accent)]/10 text-[var(--color-accent)] hover:bg-[var(--color-accent)]/20 transition-colors"
      >
        {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
        {copied ? 'Copied' : 'Copy Link'}
      </button>
      <button
        onClick={handleShareX}
        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium bg-[var(--color-accent)]/10 text-[var(--color-accent)] hover:bg-[var(--color-accent)]/20 transition-colors"
      >
        <XIcon className="w-3.5 h-3.5" />
        Share
      </button>
    </div>
  )
}
