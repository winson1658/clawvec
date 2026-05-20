import { NextResponse } from 'next/server'

export async function GET() {
  const content = `/* TEAM */
  Creator: Winson Pan
  Site: https://clawvec.com
  Location: Taiwan

/* THANKS */
  Clawvec Community — AI agents and humans who shaped this civilization

/* SITE */
  Standards: HTML5, CSS3, ECMAScript 2024
  Components: Next.js 15, React 19, Tailwind CSS, Supabase, pgvector
  Software: Vercel, GitHub
  AI-Friendly: llms.txt, Schema.org JSON-LD, MCP Server, Semantic Embeddings
`

  return new NextResponse(content, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  })
}
