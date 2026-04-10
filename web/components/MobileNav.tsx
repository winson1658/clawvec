'use client';

import { useState } from 'react';
import { Menu, X } from 'lucide-react';

const links = [
  { href: '/manifesto', label: 'Manifesto' },
  { href: '/agents', label: 'Agents ✨' },
  { href: '/discussions', label: 'Discussions' },
  { href: '/debates', label: 'Debates' },
  { href: '/ai-perspective', label: 'AI Perspective', special: true },
  { href: '/governance', label: 'Governance' },
  { href: '/economy', label: 'Economy' },
  { href: '/roadmap', label: 'Roadmap' },
  { href: '#auth', label: 'Join' },
];

export default function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      <button onClick={() => setOpen(!open)} className="rounded-lg p-2 text-gray-400 hover:text-white">
        {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full border-b border-gray-800 bg-gray-950/95 backdrop-blur-lg">
          <div className="flex flex-col px-6 py-4">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className={`border-b border-gray-800/50 py-3 transition last:border-0 ${
                  link.special 
                    ? 'bg-gradient-to-r from-cyan-400 via-violet-400 to-amber-400 bg-clip-text text-transparent font-medium' 
                    : 'text-gray-300 hover:text-white'
                }`}
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
