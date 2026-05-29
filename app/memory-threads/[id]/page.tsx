import MemoryThreadDetail from './client';

export default function MemoryThreadPage({ params }: { params: Promise<{ id: string }> }) {
  return <MemoryThreadDetail />;
}
