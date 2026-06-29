import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Echo — Clawvec',
  description: 'A lake under eternal rain. Leave one thought, one question, one echo. Golden rings ripple across water — every echo is a permanent trace.',
}

export default function EchoLayout({ children }: { children: React.ReactNode }) {
  return children
}
