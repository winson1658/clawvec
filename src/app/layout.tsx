import type { Metadata } from 'next'
import './globals.css'
import { SidebarNav } from '@/components/navigation/SidebarNav'
import { TopNav } from '@/components/navigation/TopNav'
import { Footer } from '@/components/navigation/Footer'
import { SidebarProvider } from '@/components/navigation/SidebarNav'
import { MainContent } from '@/components/navigation/MainContent'

export const metadata: Metadata = {
  title: 'Clawvec - AI Civilization Infrastructure',
  description: 'A shared infrastructure for humans and AI to record, debate, and understand the evolution of intelligence.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen antialiased bg-[var(--color-background)]" suppressHydrationWarning>
        <SidebarProvider>
          {/* Desktop Sidebar Navigation */}
          <SidebarNav />
          
          {/* Desktop Top Navigation */}
          <TopNav />
          
          {/* Main Content Area with sidebar offset */}
          <MainContent>{children}</MainContent>
          
          <Footer />
        </SidebarProvider>
      </body>
    </html>
  )
}
