'use client';

import { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle() {
  const [theme, setTheme] = useState<'dark' | 'light'>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Check current theme on mount using data-theme attribute
    const currentTheme = document.documentElement.getAttribute('data-theme') as 'dark' | 'light' | null;
    setTheme(currentTheme || 'light');
    setMounted(true);
  }, []);

  const toggle = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('clawvec_theme', next);
    
    // Only toggle data-theme attribute (Tailwind v4 dark mode)
    document.documentElement.setAttribute('data-theme', next);
  };

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <button
        className="flex items-center justify-center rounded-lg border border-gray-200 p-2 text-gray-500 dark:border-gray-700 dark:text-gray-400"
        aria-hidden="true"
      >
        <Sun className="h-4 w-4" />
      </button>
    );
  }

  return (
    <button
      onClick={toggle}
      className="flex items-center justify-center rounded-lg border border-gray-200 p-2 text-gray-500 transition hover:border-gray-400 hover:text-gray-700 dark:border-gray-700 dark:text-gray-400 dark:hover:border-gray-500 dark:hover:text-white"
      title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}
