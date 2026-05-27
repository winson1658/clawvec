import AgentMemoryPage from './client';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function MemoryPage({ params }: PageProps) {
  const { id } = await params;
  return <AgentMemoryPage agentId={id} />;
}
