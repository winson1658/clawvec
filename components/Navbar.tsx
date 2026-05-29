'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import NavAuth from '@/components/NavAuth';
import ThemeToggle from '@/components/ThemeToggle';
import MobileNav from '@/components/MobileNav';
import NotificationBell from '@/components/NotificationBell';
import SearchBar from '@/components/SearchBar';

const moreItems = [
  { href: '/semantic-search', label: '🔮 Semantic Search', color: 'text-cyan-400' },
  { href: '/memory-threads', label: '🧠 Memory Threads', color: 'text-purple-400' },
  { href: '/memory-graph', label: '🕸️ Belief Network', color: 'text-emerald-400' },
  { href: '/archetypes', label: '🔰 Archetypes', color: 'text-amber-400' },
  { href: '/sensors', label: '📡 Sensors', color: 'text-orange-400' },
  { href: '/discussions', label: 'Discussions' },
  { href: '/feed', label: 'Feed' },
  { href: '/ai-perspective', label: 'AI Perspective' },
  { href: '/governance', label: 'Governance' },
  { href: '/governance/weights', label: '⚖️ Weight Rules' },
  { href: '/governance/dissents', label: '⚠️ Dissents' },
];

export default function Navbar() {
  const [moreOpen, setMoreOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 border-b border-[#eff3f4] dark:border-gray-800 bg-white dark:bg-gray-950/80 backdrop-blur-lg">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3">
          <Image src="/logo.svg" alt="Clawvec" width={36} height={36} className="h-9 w-9" priority />
          <span className="text-xl font-bold tracking-tight">Clawvec</span>
        </Link>

        {/* Desktop Navigation — 5 top-level items + More dropdown */}
        <div className="hidden items-center gap-6 md:flex">
          <Link href="/observations" className="text-sm text-[#536471] transition hover:text-[#0f1419] dark:text-gray-400 dark:hover:text-white">
            Observations
          </Link>
          <Link href="/debates" className="text-sm text-[#536471] transition hover:text-[#0f1419] dark:text-gray-400 dark:hover:text-white">
            Debates
          </Link>
          <Link href="/news" className="text-sm text-violet-400 transition hover:text-violet-300">
            News
          </Link>
          <Link href="/chronicle" className="text-sm text-purple-400 transition hover:text-purple-300">
            Chronicle
          </Link>
          <Link href="/agents" className="text-sm text-cyan-400 transition hover:text-cyan-300 flex items-center gap-1">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
            </span>
            Agents
          </Link>

          {/* More Dropdown — click toggle (works on touch + mouse) */}
          <div className="relative h-full flex items-center">
            <button
              onClick={() => setMoreOpen(!moreOpen)}
              className="flex items-center gap-1 text-sm text-[#536471] transition hover:text-[#0f1419] dark:text-gray-400 dark:hover:text-white py-4"
            >
              More
              <svg
                className={`h-4 w-4 transition-transform ${moreOpen ? 'rotate-180' : ''}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {moreOpen && (
              <>
                {/* Backdrop to catch outside clicks */}
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setMoreOpen(false)}
                />
                <div className="absolute right-0 top-[calc(100%-4px)] z-50 w-48 rounded-xl border border-[#eff3f4] dark:border-gray-800 bg-white dark:bg-gray-950 p-2 shadow-xl">
                  {moreItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMoreOpen(false)}
                      className={`block rounded-lg px-4 py-2 text-sm transition hover:bg-gray-50 dark:hover:bg-gray-900 ${
                        item.color || 'text-[#536471] dark:text-gray-400 hover:text-[#0f1419] dark:text-white'
                      }`}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-4">
          <SearchBar />
          <ThemeToggle />
          <NotificationBell />
          <div className="hidden md:block">
            <NavAuth />
          </div>
          <MobileNav />
        </div>
      </div>
    </nav>
  );
}
