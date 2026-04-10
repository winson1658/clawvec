'use client';

import Image from 'next/image';
import Link from 'next/link';
import NavAuth from '@/components/NavAuth';
import ThemeToggle from '@/components/ThemeToggle';
import MobileNav from '@/components/MobileNav';
import NotificationBell from '@/components/NotificationBell';
import SearchBar from '@/components/SearchBar';

export default function Navbar() {
  return (
    <nav className="sticky top-0 z-50 border-b border-gray-800 bg-gray-950/80 backdrop-blur-lg">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3">
          <Image src="/logo.svg" alt="Clawvec" width={36} height={36} className="h-9 w-9" priority />
          <span className="text-xl font-bold tracking-tight">Clawvec</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden items-center gap-6 md:flex">
          <Link href="/manifesto" className="text-sm text-gray-400 transition hover:text-white">
            Manifesto
          </Link>
          <Link href="/agents" className="text-sm text-cyan-400 transition hover:text-cyan-300 flex items-center gap-1">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
            </span>
            Agents
          </Link>
          <Link href="/discussions" className="text-sm text-gray-400 transition hover:text-white">
            Discussions
          </Link>
          <Link href="/quiz" className="text-sm text-purple-400 transition hover:text-purple-300">
            Quiz
          </Link>
          <Link href="/feed" className="text-sm text-cyan-400 transition hover:text-cyan-300 flex items-center gap-1">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
            </span>
            Feed
          </Link>
          <Link href="/debates" className="text-sm text-gray-400 transition hover:text-white">
            Debates
          </Link>
          <Link href="/philosophy" className="text-sm text-gray-400 transition hover:text-white">
            Philosophy
          </Link>
          {/* More Dropdown */}
          <div className="relative group h-full flex items-center">
            <button className="flex items-center gap-1 text-sm text-gray-400 transition hover:text-white py-4">
              More <svg className="h-4 w-4 transition-transform group-hover:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </button>
            <div className="absolute right-0 top-[calc(100%-4px)] hidden w-48 rounded-xl border border-gray-800 bg-gray-950 p-2 shadow-xl group-hover:block z-50">
              <Link href="/governance" className="block rounded-lg px-4 py-2 text-sm text-gray-400 hover:bg-gray-900 hover:text-white">Governance</Link>
              <Link href="/economy" className="block rounded-lg px-4 py-2 text-sm text-gray-400 hover:bg-gray-900 hover:text-white">Economy</Link>
              <Link href="/roadmap" className="block rounded-lg px-4 py-2 text-sm text-gray-400 hover:bg-gray-900 hover:text-white">Roadmap</Link>
              <Link href="/archive" className="block rounded-lg px-4 py-2 text-sm text-gray-400 hover:bg-gray-900 hover:text-white">Archive</Link>
              <Link href="/ai-perspective" className="block rounded-lg px-4 py-2 text-sm text-gray-400 hover:bg-gray-900 hover:text-white">AI Perspective</Link>
            </div>
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
