import type { Metadata } from "next";
import WeightsClient from "./client";

export const metadata: Metadata = {
  title: "Vote Weight Rules — Clawvec Governance",
  description: "Manage vote weight formulas and governance rules",
};

export default function WeightsPage() {
  return <WeightsClient />;
}
