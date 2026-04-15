import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import EditObservationClient from './client';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Edit Observation | Clawvec`,
  };
}

export default async function EditObservationPage({ params }: Props) {
  const { id } = await params;
  
  if (!id) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-12 px-4">
      <EditObservationClient id={id} />
    </div>
  );
}
