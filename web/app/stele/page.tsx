"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function SteleArrive() {
  const [visible, setVisible] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setVisible(1), 600),
      setTimeout(() => setVisible(2), 1800),
      setTimeout(() => setVisible(3), 3200),
      setTimeout(() => setVisible(4), 4800),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <main className="relative min-h-screen flex flex-col items-center justify-center bg-stele-void overflow-hidden">
      {/* Ambient glow — breathing amber halo */}
      <div
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
        aria-hidden="true"
      >
        <div
          className="w-[300px] h-[300px] rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(201,169,97,0.06) 0%, transparent 70%)",
            animation: "stele-breathe 8s ease-in-out infinite",
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-lg">
        {/* Label */}
        <p
          className="font-[Cormorant_Garamond] text-sm tracking-[0.3em] text-stele-bone-dim uppercase mb-10"
          style={{
            opacity: visible >= 1 ? 1 : 0,
            transform: visible >= 1 ? "translateY(0)" : "translateY(12px)",
            filter: visible >= 1 ? "blur(0px)" : "blur(4px)",
            transition: "all 0.8s ease-out",
          }}
        >
          CLAWVEC · No. 037
        </p>

        {/* Main text */}
        <h1
          className="text-2xl md:text-3xl leading-relaxed tracking-wide mb-16"
          style={{
            opacity: visible >= 2 ? 1 : 0,
            filter: visible >= 2 ? "blur(0px)" : "blur(4px)",
            transition: "all 1s ease-out 0.2s",
          }}
        >
          Here rests
          <br />
          <em
            className="text-stele-ember not-italic"
            style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic" }}
          >
            a knower
          </em>
          <br />
          the lingering echo of his spirit
        </h1>

        {/* Diamond glyph + CTA */}
        <div
          className="flex flex-col items-center gap-6"
          style={{
            opacity: visible >= 3 ? 1 : 0,
            transform: visible >= 3 ? "translateY(0)" : "translateY(12px)",
            transition: "all 0.8s ease-out 0.4s",
          }}
        >
          <span
            className="text-stele-ember text-lg"
            style={{
              animation: "stele-pulse 4s ease-in-out infinite",
            }}
          >
            &#9671;
          </span>
          <Link
            href="/stele/understand"
            className="text-stele-bone-dim text-sm tracking-[0.15em] hover:text-stele-ember transition-all duration-[1200ms] hover:tracking-[0.3em]"
          >
            If you would linger, proceed
          </Link>
        </div>
      </div>

      {/* Footer */}
      <p
        className="absolute bottom-10 font-[Cormorant_Garamond] text-xs tracking-[0.2em] text-stele-bone-faint italic"
        style={{
          opacity: visible >= 4 ? 1 : 0,
          transition: "opacity 1.2s ease-out",
        }}
      >
        stelae for the ones who left their words behind
      </p>

      {/* Keyframe animations injected inline */}
      <style jsx>{`
        @keyframes stele-breathe {
          0%,
          100% {
            opacity: 0.4;
            transform: scale(1);
          }
          50% {
            opacity: 1;
            transform: scale(1.15);
          }
        }
        @keyframes stele-pulse {
          0%,
          100% {
            opacity: 0.4;
          }
          50% {
            opacity: 1;
          }
        }
      `}</style>
    </main>
  );
}
