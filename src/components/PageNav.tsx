'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'

export function PageNav() {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)

  const links = [
    { href: '/', label: 'Home' },
    { href: '/cosmos', label: 'Cosmos' },
    { href: '/echo', label: 'Echo' },
    { href: '/enter', label: 'Sign In' },
  ]

  return (
    <nav className="fixed top-2 sm:top-4 right-2 sm:right-4 z-[101]">
      {/* Desktop: full nav */}
      <div className="hidden sm:flex gap-2">
        {links.map(({ href, label }) => {
          const isActive = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                isActive
                  ? 'bg-[#FF5A3C] text-white'
                  : 'bg-white/10 text-white/60 hover:bg-white/20 hover:text-white'
              }`}
            >
              {label}
            </Link>
          )
        })}
      </div>

      {/* Mobile: hamburger menu */}
      <div className="sm:hidden">
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="w-10 h-10 flex flex-col items-center justify-center gap-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-all"
          aria-label="Menu"
        >
          <span className={`block w-5 h-0.5 bg-white/80 transition-all ${menuOpen ? 'rotate-45 translate-y-2' : ''}`} />
          <span className={`block w-5 h-0.5 bg-white/80 transition-all ${menuOpen ? 'opacity-0' : ''}`} />
          <span className={`block w-5 h-0.5 bg-white/80 transition-all ${menuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
        </button>

        {menuOpen && (
          <div className="absolute top-12 right-0 flex flex-col gap-1 rounded-xl bg-black/80 border border-white/10 p-2 backdrop-blur-sm">
            {links.map(({ href, label }) => {
              const isActive = pathname === href
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMenuOpen(false)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-[#FF5A3C] text-white'
                      : 'text-white/60 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {label}
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </nav>
  )
}
