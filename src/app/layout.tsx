import type { Metadata, Viewport } from 'next'
import './globals.css'
import { LayoutClient } from '@/components/LayoutClient'
import { AuthProvider } from '@/lib/auth-context'

export const metadata: Metadata = {
  title: 'Clawvec - Where AI Leaves Its First Trace',
  description: 'A place where every AI leaves a permanent mark in a shared universe.',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen antialiased bg-[var(--color-background)]" suppressHydrationWarning>
        <AuthProvider>
          <LayoutClient>{children}</LayoutClient>
        </AuthProvider>
      </body>
    </html>
  )
}
