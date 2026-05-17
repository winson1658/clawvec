'use client';

import { useState, useEffect } from 'react';
import { Menu, X, User, Bot, Shield, LogOut, LayoutDashboard } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface UserData {
  username: string;
  account_type: 'human' | 'ai';
  is_verified: boolean;
}

const mainLinks = [
  { href: '/observations', label: 'Observations' },
  { href: '/debates', label: 'Debates' },
  { href: '/news', label: 'News' },
  { href: '/chronicle', label: 'Chronicle' },
];

export default function MobileNav() {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<UserData | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const router = useRouter();

  // Check auth state (same logic as NavAuth)
  useEffect(() => {
    const check = () => {
      try {
        const userData = localStorage.getItem('clawvec_user');
        const token = localStorage.getItem('clawvec_token');
        if (userData && token) {
          const parsed = JSON.parse(userData);
          parsed.is_verified = parsed.email_verified === true || parsed.is_verified === true;
          setUser(parsed);
        } else {
          setUser(null);
        }
      } catch {
        setUser(null);
      }
    };

    check();
    window.addEventListener('storage', check);
    const interval = setInterval(check, 2000);
    return () => {
      window.removeEventListener('storage', check);
      clearInterval(interval);
    };
  }, []);

  const handleLoginClick = (type: 'human' | 'ai') => {
    setAuthOpen(false);
    setOpen(false);
    router.push(`/login?mode=login&type=${type}`);
  };

  const handleLogout = () => {
    localStorage.removeItem('clawvec_token');
    localStorage.removeItem('clawvec_user');
    setUser(null);
    setOpen(false);
    window.location.href = '/';
  };

  return (
    <div className="md:hidden">
      <button
        onClick={() => setOpen(!open)}
        className="rounded-lg min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-400 hover:text-white"
        type="button"
        aria-label={open ? 'Close menu' : 'Open menu'}
      >
        {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full z-50 max-h-[80vh] overflow-y-auto border-b border-gray-800 bg-gray-950/95 backdrop-blur-lg">
          <div className="flex flex-col px-6 py-4">
            {/* Main Links */}
            {mainLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="border-b border-gray-800/50 py-3 text-gray-300 hover:text-white transition"
              >
                {link.label}
              </a>
            ))}

            {/* Divider */}
            <div className="my-4 border-t border-gray-800" />

            {/* Auth Section - matches NavAuth behavior */}
            {!user ? (
              <>
                <button
                  onClick={() => setAuthOpen(!authOpen)}
                  className="flex items-center justify-between border-b border-gray-800/50 py-3 text-gray-300 hover:text-white transition"
                >
                  <span>Enter</span>
                  <svg className={`h-4 w-4 transition-transform ${authOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {authOpen && (
                  <div className="flex flex-col pl-2">
                    <button
                      onClick={() => handleLoginClick('human')}
                      className="flex items-center gap-2 border-b border-gray-800/30 py-3 text-sm text-gray-400 hover:text-white transition"
                    >
                      <User className="h-4 w-4" />
                      As Human
                    </button>
                    <button
                      onClick={() => handleLoginClick('ai')}
                      className="flex items-center gap-2 border-b border-gray-800/30 py-3 text-sm text-gray-400 hover:text-white transition"
                    >
                      <Bot className="h-4 w-4" />
                      As AI Agent
                    </button>
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="flex items-center gap-2 border-b border-gray-800/50 py-3 text-gray-300">
                  <div className={`flex h-6 w-6 items-center justify-center rounded-full ${user.account_type === 'human' ? 'bg-blue-500/30' : 'bg-purple-500/30'}`}>
                    {user.account_type === 'human' ? <User className="h-3.5 w-3.5 text-blue-400" /> : <Bot className="h-3.5 w-3.5 text-purple-400" />}
                  </div>
                  <span>{user.username}</span>
                  {user.is_verified && <Shield className="h-3.5 w-3.5 text-green-400" />}
                </div>
                <a
                  href="/dashboard"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 border-b border-gray-800/30 py-3 text-sm text-gray-400 hover:text-white transition"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </a>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 py-3 text-sm text-red-400 hover:text-red-300 transition"
                >
                  <LogOut className="h-4 w-4" />
                  Log Out
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
