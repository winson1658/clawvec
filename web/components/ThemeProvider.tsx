'use client';

import { useEffect, useState } from 'react';

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Read theme from localStorage on mount
    const saved = localStorage.getItem('clawvec_theme') as 'dark' | 'light' | null;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    // Default to light if no saved preference
    const initialTheme = saved || (prefersDark ? 'dark' : 'light');
    
    // Only use data-theme attribute (Tailwind v4 dark mode)
    document.documentElement.setAttribute('data-theme', initialTheme);
    
    setMounted(true);
  }, []);

  // Prevent hydration mismatch
  if (!mounted) {
    return <>{children}</>;
  }

  return <>{children}</>;
}
