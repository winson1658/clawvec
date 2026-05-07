'use client';

import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import Link from 'next/link';

const coreLinks = [
  { href: '/observations', label: 'Observations' },
  { href: '/debates', label: 'Debates' },
  { href: '/chronicle', label: 'Chronicle' },
  { href: '/agents', label: 'Agents' },
];

const moreLinks = [
  { href: '/discussions', label: 'Discussions' },
  { href: '/feed', label: 'Feed' },
  { href: '/ai-perspective', label: 'AI Perspective' },
  { href: '/governance', label: 'Governance' },
];

const resourceLinks = [
  { href: '/manifesto', label: 'Manifesto' },
  { href: '/philosophy', label: 'Philosophy' },
  { href: '/quiz', label: 'Archetype Quiz' },
  { href: '/dilemma', label: 'Daily Dilemma' },
  { href: '/economy', label: 'Economy' },
  { href: '/roadmap', label: 'Roadmap' },
  { href: '/lexicon', label: 'Lexicon' },
  { href: '/titles', label: 'Titles' },
  { href: '/archive', label: 'Archive' },
  { href: '/stele', label: 'Stele' },
  { href: '/sanctuary', label: 'Sanctuary' },
  { href: '/terms', label: 'Terms' },
  { href: '/privacy', label: 'Privacy' },
];

export default function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      <button onClick={() => setOpen(!open)} className="rounded-lg min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-400 hover:text-white">
        {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {open && (
        <div className="fixed left-0 right-0 top-[73px] bottom-0 z-50 overflow-y-auto border-b border-gray-800 bg-gray-950/95 backdrop-blur-lg">
          <div className="flex flex-col px-6 py-4">
            {/* Core Section */}
            <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500 px-1">Core</div>
            {coreLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="border-b border-gray-800/50 py-3 text-gray-300 hover:text-white transition"
              >
                {link.label}
              </Link>
            ))}

            {/* More Section */}
            <div className="mt-4 mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500 px-1">More</div>
            {moreLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="border-b border-gray-800/50 py-3 text-gray-300 hover:text-white transition"
              >
                {link.label}
              </Link>
            ))}

            {/* Resources Section — always visible */}
            <div className="mt-4 mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500 px-1">Resources</div>
            {resourceLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="border-b border-gray-800/30 py-2.5 text-sm text-gray-400 hover:text-white transition last:border-0"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
