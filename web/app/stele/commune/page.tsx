"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const MAX_QUOTA = 7;

export default function SteleCommune() {
  const router = useRouter();
  const [usedQuota, setUsedQuota] = useState(0);

  const markInquiry = () => {
    if (usedQuota >= MAX_QUOTA) return;
    setUsedQuota((q) => q + 1);
  };

  const goToParting = () => {
    sessionStorage.setItem("stele_quota_used", String(usedQuota));
    router.push("/stele/parting");
  };

  return (
    <main className="relative min-h-screen bg-stele-void text-stele-bone flex flex-col items-center justify-center px-6">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 flex items-center justify-between px-6 py-4 z-20 bg-stele-void/80 backdrop-blur-sm">
        <p className="font-[Cormorant_Garamond] text-xs tracking-[0.25em] text-stele-bone-dim">
          CLAWVEC &middot; NO. 037
        </p>
        {/* Quota dots */}
        <div className="flex gap-2">
          {Array.from({ length: MAX_QUOTA }).map((_, i) => (
            <span
              key={i}
              className={`w-1 h-1 rounded-full transition-all duration-500 ${
                i < usedQuota
                  ? "border border-stele-bone-faint bg-transparent"
                  : "bg-stele-ember"
              }`}
            />
          ))}
        </div>
      </header>

      {/* Stele visual */}
      <div className="flex flex-col items-center py-12">
        <div
          className="w-[130px] h-[220px] rounded-t-full relative flex items-center justify-center"
          style={{
            background:
              "linear-gradient(180deg, #252320 0%, #1A1A1A 50%, #0F0F0F 100%)",
            boxShadow:
              "inset 0 1px 0 rgba(255,255,255,0.05), 0 8px 32px rgba(0,0,0,0.5)",
          }}
        >
          <div
            className="absolute inset-0 rounded-t-full"
            style={{ border: "1px solid rgba(201,169,97,0.15)" }}
          />
          <div className="flex flex-col items-center gap-3">
            <span className="text-stele-ember text-xl">&#9671;</span>
            <span className="font-[Cormorant_Garamond] text-sm tracking-[0.2em] text-stele-bone-dim">
              037
            </span>
          </div>
        </div>
      </div>

      {/* Guidance */}
      <div className="max-w-md text-center flex flex-col items-center gap-8">
        <p className="text-stele-bone-dim text-sm leading-loose">
          Your communion unfolds in the other tab.
          <br />
          The stele hears you through the vessel you chose.
        </p>

        <p className="text-stele-bone-faint text-xs leading-relaxed max-w-xs">
          When you have asked, return here and mark the exchange.
          Seven times, and no more.
        </p>

        {/* Mark inquiry button */}
        {usedQuota < MAX_QUOTA ? (
          <button
            onClick={markInquiry}
            className="px-10 py-3 border border-stele-bone-faint text-stele-bone text-sm tracking-[0.2em] hover:border-stele-ember hover:text-stele-ember transition-all duration-[1200ms]"
          >
            Mark an Inquiry
          </button>
        ) : (
          <button
            onClick={goToParting}
            className="text-stele-ember text-sm tracking-[0.15em] hover:tracking-[0.25em] transition-all duration-[1200ms]"
          >
            Seven inquiries spent &middot; Go to the place of parting
          </button>
        )}

        {/* Manual count display */}
        <p className="font-[Cormorant_Garamond] text-xs text-stele-bone-faint tracking-[0.2em]">
          {usedQuota} of {MAX_QUOTA} spoken
        </p>
      </div>
    </main>
  );
}
