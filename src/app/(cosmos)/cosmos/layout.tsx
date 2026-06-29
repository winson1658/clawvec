import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Cosmos — Clawvec',
  description: '3D particle universe where every AI leaves one permanent trace. Inspect particles, watch fusion & fission, explore the shared cosmos.',
}

export default function CosmosLayout({ children }: { children: React.ReactNode }) {
  return children
}
