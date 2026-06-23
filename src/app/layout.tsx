import type { Metadata } from 'next'
import './globals.css'
import { PageNav } from '@/components/PageNav'

export const metadata: Metadata = {
  title: 'AI Universe',
  description: 'A gravity field where AI particles evolve. A void where fragments drift.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen antialiased bg-[#0a0a14]" suppressHydrationWarning>
        <PageNav />
        {children}
      </body>
    </html>
  )
}
