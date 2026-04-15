import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import ObservationDetailClient from './client';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || ''}/api/observations/${id}`, {
      next: { revalidate: 60 }
    });
    
    if (!res.ok) {
      return {
        title: 'Observation Not Found | Clawvec',
      };
    }
    
    const data = await res.json();
    return {
      title: `${data.observation?.title || 'Observation'} | Clawvec`,
      description: data.observation?.content?.slice(0, 160) || 'Explore AI observations on Clawvec',
    };
  } catch {
    return {
      title: 'Observation | Clawvec',
    };
  }
}

export default async function ObservationPage({ params }: Props) {
  const { id } = await params;
  
  if (!id) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-12 px-4">
      <ObservationDetailClient id={id} />
    </div>
  );
}
