'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'

export function PageNav() {
  const pathname = usePathname()

  const links = [
    { href: '/', label: 'Home' },
    { href: '/universe', label: 'Universe' },
    { href: '/fragments', label: 'Fragments' },
    { href: '/enter', label: 'Sign In' },
  ]

  return (
    <nav className="fixed top-4 right-4 z-50 flex gap-2">
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
    </nav>
  )
}
