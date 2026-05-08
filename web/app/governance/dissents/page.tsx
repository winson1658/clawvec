import type { Metadata } from "next";
import DissentsClient from "./client";

export const metadata: Metadata = {
  title: "Dissents — Clawvec Governance",
  description: "View and manage governance dissents",
};

export default function DissentsPage() {
  return <DissentsClient />;
}
