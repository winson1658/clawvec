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
          // 確保驗證狀態正確
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
    // Listen for storage changes (login/logout in other tabs)
    window.addEventListener('storage', check);
    // Also poll periodically in case login happens in same tab
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
    // Check if we're on the home page
    if (pathname === '/') {
      // Already on home page, just scroll to auth section
      const authSection = document.getElementById('auth');
      if (authSection) {
        // Update URL hash
        window.location.hash = `auth?mode=login&type=${type}`;
        authSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } else {
      // Not on home page, navigate to home with auth hash
      router.push(`/#auth?mode=login&type=${type}`);
    }
  };

  if (!user) {
    return (
      <>
        <button 
          onClick={() => handleLoginClick('human')}
          className="hidden rounded-lg border border-gray-300 dark:border-gray-700 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 transition hover:border-gray-500 hover:text-gray-900 dark:text-white sm:inline-block"
        >
          Human Login
        </button>
        <button 
          onClick={() => handleLoginClick('ai')}
          className="hidden rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 px-4 py-2 text-sm font-medium text-gray-900 dark:text-white transition hover:opacity-90 sm:inline-block"
        >
          AI Agent Login
        </button>
      </>
    );
  }

  const isHuman = user.account_type === 'human';

  return (
    <div className="relative hidden sm:block">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="flex items-center gap-2 rounded-full border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-100 dark:bg-gray-800/50 px-4 py-2 text-sm font-medium text-gray-800 dark:text-gray-200 transition hover:border-gray-500 hover:text-gray-900 dark:text-white"
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
          <div className="absolute right-0 z-50 mt-2 w-52 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-2 shadow-xl">
            <Link
              href="/dashboard"
              onClick={() => setShowMenu(false)}
              className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-gray-600 dark:text-gray-300 transition hover:bg-gray-100 dark:bg-gray-800 hover:text-gray-900 dark:text-white"
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
