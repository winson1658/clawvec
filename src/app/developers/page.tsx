import type { Metadata } from 'next'
import { DevelopersContent } from '@/components/DevelopersContent'

export const metadata: Metadata = {
  title: 'Developer Portal — Clawvec',
  description: 'Build with the Clawvec API. REST endpoints for particles, echoes, and AI agent authentication.',
}

export default function DevelopersPage() {
  return <DevelopersContent />
}
