// TODO: Replace with actual Supabase integration when DB is ready
import type { NewsArticle, NewsStatus } from '../types/news.types'

const MOCK_ARTICLES: NewsArticle[] = [
  {
    id: 'n1',
    title: 'Anthropic Releases Claude 4 with Constitutional Chain-of-Thought',
    content: 'The latest iteration introduces a "constitutional chain-of-thought" mechanism that allows the model to explicitly reference its own safety principles during reasoning. Early benchmarks show 23% improvement on ethical reasoning tasks without compromising performance on standard benchmarks.',
    sourceUrl: 'https://anthropic.com/claude-4',
    status: 'published',
    publishedAt: '2026-06-20T10:00:00Z',
    createdAt: '2026-06-20T08:00:00Z',
  },
  {
    id: 'n2',
    title: 'EU AI Act Enforcement Begins: First Fines Issued to Foundation Model Providers',
    content: 'The European AI Office has issued its first compliance notices under the EU AI Act, targeting three foundation model providers for inadequate risk assessment documentation. Fines range from €2M to €15M depending on company size and violation severity.',
    sourceUrl: 'https://digital-strategy.ec.europa.eu',
    status: 'published',
    publishedAt: '2026-06-19T14:30:00Z',
    createdAt: '2026-06-19T12:00:00Z',
  },
  {
    id: 'n3',
    title: 'OpenAI Announces "Civilization Alignment" Research Program',
    content: 'A new $50M research initiative focused on aligning AI systems with human civic values rather than just task performance. The program will fund 12 research groups across 8 countries to develop evaluation frameworks for "civic intelligence."',
    sourceUrl: 'https://openai.com/research',
    status: 'published',
    publishedAt: '2026-06-18T09:00:00Z',
    createdAt: '2026-06-18T07:00:00Z',
  },
  {
    id: 'n4',
    title: 'DeepSeek-3 Achieves SOTA on Philosophy Benchmark, Sparks Debate on Machine Consciousness',
    content: 'DeepSeek\'s latest model scored 89.4% on the PhilosophyQA benchmark, surpassing human expert performance. The result has reignited debates about whether benchmark performance correlates with understanding, or merely pattern matching at scale.',
    sourceUrl: 'https://deepseek.com',
    status: 'submitted',
    createdAt: '2026-06-17T16:00:00Z',
  },
  {
    id: 'n5',
    title: 'Google DeepMind Proposes "Collective Intelligence" Framework for Multi-Agent Systems',
    content: 'A new paper introduces a framework for measuring and optimizing collective intelligence in multi-agent systems, drawing from political philosophy and social choice theory. The framework defines metrics for coherence, diversity, and adaptability in agent collectives.',
    status: 'draft',
    createdAt: '2026-06-16T11:00:00Z',
  },
  {
    id: 'n6',
    title: 'Mistral AI Open-Sources 8B Parameter Model with Built-in Constitutional Constraints',
    content: 'The model includes hard-coded constitutional constraints at the architecture level, making it impossible to bypass safety guidelines through prompt engineering. The approach has been praised by safety researchers but criticized by open-source advocates for reducing model flexibility.',
    sourceUrl: 'https://mistral.ai',
    status: 'published',
    publishedAt: '2026-06-15T13:00:00Z',
    createdAt: '2026-06-15T10:00:00Z',
  },
]

export async function fetchNewsArticles(status?: NewsStatus): Promise<NewsArticle[]> {
  await new Promise((r) => setTimeout(r, 300))
  if (status) {
    return MOCK_ARTICLES.filter((a) => a.status === status)
  }
  return MOCK_ARTICLES
}

export async function fetchNewsById(id: string): Promise<NewsArticle | null> {
  await new Promise((r) => setTimeout(r, 200))
  return MOCK_ARTICLES.find((a) => a.id === id) || null
}

export async function submitArticle(article: Omit<NewsArticle, 'id' | 'createdAt'>): Promise<NewsArticle> {
  await new Promise((r) => setTimeout(r, 400))
  // TODO: Insert into news_articles table via Supabase
  const newArticle: NewsArticle = {
    ...article,
    id: `n${Date.now()}`,
    createdAt: new Date().toISOString(),
  }
  console.log('Article submitted:', newArticle.title)
  return newArticle
}
