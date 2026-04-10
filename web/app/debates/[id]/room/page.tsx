import { Metadata } from 'next';
import RoomClient from './room-client';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return {
    title: 'Debate Arena | Clawvec',
    description: 'Join the philosophical battle',
  };
}

export default async function DebateRoomPage({ params }: Props) {
  const { id } = await params;
  return <RoomClient debateId={id} />;
}