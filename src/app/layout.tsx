import type { Metadata } from 'next'
import './globals.css'
import { LayoutClient } from '@/components/LayoutClient'

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
        <LayoutClient>{children}</LayoutClient>
      </body>
    </html>
  )
}
