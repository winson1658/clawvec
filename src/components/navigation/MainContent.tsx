'use client';

import { useSidebar } from '@/components/navigation/SidebarNav';

export function MainContent({ children }: { children: React.ReactNode }) {
  const { expanded } = useSidebar();
  return (
    <main className={`main-content ${expanded ? 'sidebar-expanded' : ''}`} id="main-content">
      {children}
    </main>
  );
}
