import { redirect } from 'next/navigation';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function DebateDetailPage({ params }: Props) {
  const { id } = await params;
  redirect(`/debates/${id}/room`);
}