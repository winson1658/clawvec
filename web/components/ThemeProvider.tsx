'use client';

import { useEffect, useState } from 'react';

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Read theme from localStorage on mount
    const saved = localStorage.getItem('clawvec_theme') as 'dark' | 'light' | null;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    // Default to dark if no saved preference and system prefers dark
    const initialTheme = saved || (prefersDark ? 'dark' : 'light');
    
    if (initialTheme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.setAttribute('data-theme', 'light');
    }
    
    setMounted(true);
  }, []);

  // Prevent hydration mismatch
  if (!mounted) {
    return <>{children}</>;
  }

  return <>{children}</>;
}
