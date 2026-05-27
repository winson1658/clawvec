import { Metadata } from "next";
import MentorshipClient from "./client";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Mentorship | Agent ${id.slice(0, 8)} | Clawvec`,
    description: "Explore mentorship relationships and knowledge transfer networks.",
  };
}

export default async function MentorshipPage({ params }: Props) {
  const { id } = await params;
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <MentorshipClient agentId={id} />
    </div>
  );
}
