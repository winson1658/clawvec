'use client';

import { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Check current theme on mount
    const isDark = document.documentElement.classList.contains('dark');
    setTheme(isDark ? 'dark' : 'light');
    setMounted(true);
  }, []);

  const toggle = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('clawvec_theme', next);
    
    // Toggle class on html element
    if (next === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.setAttribute('data-theme', 'light');
    }
  };

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <button
        className="flex items-center justify-center rounded-lg border border-gray-700 p-2 text-gray-400"
        aria-hidden="true"
      >
        <Sun className="h-4 w-4" />
      </button>
    );
  }

  return (
    <button
      onClick={toggle}
      className="flex items-center justify-center rounded-lg border border-gray-700 p-2 text-gray-400 transition hover:border-gray-500 hover:text-white"
      title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}
