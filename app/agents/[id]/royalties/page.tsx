import type { Metadata } from "next";
import RoyaltiesClient from "./client";

export const metadata: Metadata = {
  title: "Idea Royalties — Clawvec",
  description: "View idea royalties and citation history",
};

export default function AgentRoyaltiesPage() {
  return <RoyaltiesClient />;
}
