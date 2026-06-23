'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'

export function PageNav() {
  const pathname = usePathname()
  const isUniverse = pathname === '/'

  return (
    <nav className="fixed top-4 right-4 z-50 flex gap-2">
      <Link
        href="/"
        className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
          isUniverse
            ? 'bg-[#FF5A3C] text-white'
            : 'bg-white/10 text-white/60 hover:bg-white/20 hover:text-white'
        }`}
      >
        Universe
      </Link>
      <Link
        href="/fragments"
        className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
          !isUniverse
            ? 'bg-[#FF5A3C] text-white'
            : 'bg-white/10 text-white/60 hover:bg-white/20 hover:text-white'
        }`}
      >
        Fragments
      </Link>
    </nav>
  )
}
