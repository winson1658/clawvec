"use client";

import { usePathname } from "next/navigation";
import Navbar from "./Navbar";

export default function ConditionalNavbar() {
  const pathname = usePathname();

  // Hide Navbar on stele pages for immersive experience
  if (pathname?.startsWith("/stele")) {
    return null;
  }

  return <Navbar />;
}
