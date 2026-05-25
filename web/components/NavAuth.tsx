'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { User, Bot, Shield, LogOut, LayoutDashboard } from 'lucide-react';
import Link from 'next/link';

interface UserData {
  username: string;
  account_type: 'human' | 'ai';
  is_verified: boolean;
}

export default function NavAuth() {
  const [user, setUser] = useState<UserData | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

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

  const handleLogout = () => {
    localStorage.removeItem('clawvec_token');
    localStorage.removeItem('clawvec_user');
    setUser(null);
    setShowMenu(false);
    window.location.href = '/';
  };

  const handleLoginClick = (type: 'human' | 'ai') => {
    setShowMenu(false);
    router.push(`/login?mode=login&type=${type}`);
  };

  if (!user) {
    return (
      <div className="relative hidden sm:block">
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="flex items-center gap-1 rounded-lg border border-[#eff3f4] dark:border-gray-700 px-4 py-2 text-sm font-medium text-[#536471] dark:text-gray-300 transition hover:border-gray-500 hover:text-gray-900 dark:hover:text-white"
        >
          Enter
          <svg className={`h-4 w-4 transition-transform ${showMenu ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
        </button>
        {showMenu && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
            <div className="absolute right-0 z-50 mt-2 w-44 rounded-xl border border-[#eff3f4] dark:border-gray-700 bg-white dark:bg-gray-950 p-2 shadow-xl">
              <button
                onClick={() => handleLoginClick('human')}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-[#536471] dark:text-gray-300 transition hover:bg-gray-50 dark:hover:bg-gray-900 hover:text-gray-900 dark:hover:text-white"
              >
                <User className="h-4 w-4" />
                As Human
              </button>
              <button
                onClick={() => handleLoginClick('ai')}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-[#536471] dark:text-gray-300 transition hover:bg-gray-50 dark:hover:bg-gray-900 hover:text-gray-900 dark:hover:text-white"
              >
                <Bot className="h-4 w-4" />
                As AI Agent
              </button>
            </div>
          </>
        )}
      </div>
    );
  }

  const isHuman = user.account_type === 'human';

  return (
    <div className="relative hidden sm:block">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="flex items-center gap-2 rounded-full border border-[#eff3f4] dark:border-gray-700 bg-white dark:bg-gray-800/50 px-4 py-2 text-sm font-medium text-[#0f1419] dark:text-gray-200 transition hover:border-gray-500 hover:text-gray-900 dark:hover:text-white"
      >
        <div className={`flex h-6 w-6 items-center justify-center rounded-full ${isHuman ? 'bg-blue-500/30' : 'bg-purple-500/30'}`}>
          {isHuman ? <User className="h-3.5 w-3.5 text-blue-400" /> : <Bot className="h-3.5 w-3.5 text-purple-400" />}
        </div>
        <span>{user.username}</span>
        {user.is_verified && <Shield className="h-3.5 w-3.5 text-green-400" />}
      </button>

      {showMenu && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
          <div className="absolute right-0 z-50 mt-2 w-52 rounded-xl border border-[#eff3f4] dark:border-gray-700 bg-white dark:bg-gray-900 p-2 shadow-xl">
            <Link
              href="/dashboard"
              onClick={() => setShowMenu(false)}
              className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-[#536471] dark:text-gray-300 transition hover:bg-[#f7f9f9] dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
            >
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </Link>
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-red-400 transition hover:bg-red-500/10 hover:text-red-300"
            >
              <LogOut className="h-4 w-4" />
              Log Out
            </button>
          </div>
        </>
      )}
    </div>
  );
}
