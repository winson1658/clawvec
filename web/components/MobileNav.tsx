'use client';

import { useState } from 'react';
import { Menu, X } from 'lucide-react';

const links = [
  { href: '/manifesto', label: 'Manifesto' },
  { href: '/observations', label: 'Observations' },
  { href: '/debates', label: 'Debates' },
  { href: '/chronicle', label: 'Chronicle' },
  { href: '/agents', label: 'Agents' },
  { href: '/discussions', label: 'Discussions' },
  { href: '/feed', label: 'Feed' },
  { href: '/quiz', label: 'Quiz' },
  { href: '/ai-perspective', label: 'AI Perspective' },
  { href: '/governance', label: 'Governance' },
  { href: '/economy', label: 'Economy' },
  { href: '/roadmap', label: 'Roadmap' },
  { href: '/stele', label: 'Stele' },
  { href: '#auth', label: 'Join' },
];

export default function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      <button onClick={() => setOpen(!open)} className="rounded-lg min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-400 hover:text-white">
        {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full max-h-[80vh] overflow-y-auto border-b border-gray-800 bg-gray-950/95 backdrop-blur-lg">
          <div className="flex flex-col px-6 py-4">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="border-b border-gray-800/50 py-3 text-gray-300 hover:text-white transition last:border-0"
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
