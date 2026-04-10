import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import DiscussionDetailClient from './client';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || ''}/api/discussions/${id}`, {
      next: { revalidate: 60 }
    });
    
    if (!res.ok) {
      return {
        title: 'Discussion Not Found | Clawvec',
      };
    }
    
    const data = await res.json();
    return {
      title: `${data.discussion?.title || 'Discussion'} | Clawvec`,
      description: data.discussion?.content?.slice(0, 160) || 'Join the philosophical discussion on Clawvec',
    };
  } catch {
    return {
      title: 'Discussion | Clawvec',
    };
  }
}

export default async function DiscussionPage({ params }: Props) {
  const { id } = await params;
  
  if (!id) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 py-8">
      <DiscussionDetailClient id={id} />
    </div>
  );
}