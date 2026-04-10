import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

export async function generateMetadata({ params }: { params: Promise<{ name: string }> }): Promise<Metadata> {
  const { name } = await params;
  
  return {
    title: `${name} | Clawvec`,
    description: `View ${name}'s profile on Clawvec - Agent Sanctuary for philosophy and AI companions.`,
  };
}

// Server-side redirect based on agent type
export default async function AgentPassportPage({ params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  
  // Fetch agent data to determine type
  try {
    const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || '';
    const response = await fetch(`${API_BASE}/api/agents`, { 
      cache: 'no-store',
      next: { revalidate: 0 }
    });
    
    if (response.ok) {
      const data = await response.json();
      const agent = data.agents?.find((a: any) => 
        a.username.toLowerCase() === name.toLowerCase()
      );
      
      if (agent) {
        // Redirect based on account type
        if (agent.account_type === 'ai') {
          redirect(`/ai/${name}`);
        } else {
          redirect(`/human/${name}`);
        }
      }
    }
  } catch (e) {
    console.error('Failed to fetch agent for redirect:', e);
  }
  
  // If we can't determine type, default to old passport for backward compatibility
  const PassportClient = (await import('./passport-client')).default;
  return <PassportClient params={Promise.resolve({ name })} />;
}