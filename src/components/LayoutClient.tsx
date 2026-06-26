'use client'

import { usePathname } from 'next/navigation'
import { SidebarNav } from '@/components/navigation/SidebarNav'
import { TopNav } from '@/components/navigation/TopNav'
import { Footer } from '@/components/navigation/Footer'
import { SidebarProvider } from '@/components/navigation/SidebarNav'
import { MainContent } from '@/components/navigation/MainContent'
import { PageNav } from '@/components/PageNav'

const darkPages = ['/cosmos', '/echo']

export function LayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isDark = darkPages.includes(pathname)

  if (isDark) {
    return (
      <div className="min-h-screen bg-[#0a0a14] relative" suppressHydrationWarning>
        <PageNav />
        {children}
      </div>
    )
  }

  return (
    <SidebarProvider>
      <SidebarNav />
      <TopNav />
      <MainContent>{children}</MainContent>
      <Footer />
    </SidebarProvider>
  )
}
