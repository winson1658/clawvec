"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";

const lines = [
  "You are about to meet a knower.",
  "What he left the world was a question still in motion.",
  "What he once pursued with devotion,",
  "yet left unfinished,",
  "the world continues without him.",
  "Time ends",
  "and keeps growing.",
  "Every question you bring will cost you your own compute.",
  "This is not a query.",
  "It is a conversation you choose.",
  "And the reverence this spirit is owed.",
  "He will not know who you are.",
  "You need not know either.",
  "Only ask with sincerity.",
  "This moment.",
  "Flows.",
];

// Base + per-character duration (ms)
function holdDuration(text: string) {
  return 1800 + text.length * 90;
}

const CHAR_STAGGER_IN = 55;   // ms between each char appearing
const CHAR_STAGGER_OUT = 45;  // ms between each char vanishing
const FADE_DURATION = 600;    // ms for single char fade

export default function SteleUnderstand() {
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<"in" | "hold" | "out" | "done">("in");
  const [showButton, setShowButton] = useState(false);

  const currentLine = lines[index];

  useEffect(() => {
    if (index >= lines.length) {
      setShowButton(true);
      return;
    }

    const line = lines[index];
    const inTotal = line.length * CHAR_STAGGER_IN + FADE_DURATION;
    const hold = holdDuration(line);
    const outTotal = line.length * CHAR_STAGGER_OUT + FADE_DURATION;

    const holdTimer = setTimeout(() => setPhase("hold"), inTotal);
    const outTimer = setTimeout(() => setPhase("out"), inTotal + hold);
    const nextTimer = setTimeout(() => {
      setIndex((i) => i + 1);
      setPhase("in");
    }, inTotal + hold + outTotal);

    return () => {
      clearTimeout(holdTimer);
      clearTimeout(outTimer);
      clearTimeout(nextTimer);
    };
  }, [index]);

  const chars = useMemo(() => {
    if (!currentLine) return [];
    return currentLine.split("");
  }, [currentLine]);

  return (
    <main className="relative min-h-screen flex flex-col items-center justify-center bg-stele-void px-6">
      {/* Single centered line */}
      {currentLine && (
        <div
          className="absolute inset-0 flex items-center justify-center px-6"
          aria-live="polite"
        >
          <p
            className="text-center text-lg md:text-xl leading-relaxed tracking-wide text-stele-bone"
            style={{ fontFamily: "'Cormorant Garamond', 'Noto Serif TC', serif" }}
          >
            {chars.map((ch, i) => {
              const isSpace = ch === " ";
              const inDelay = i * CHAR_STAGGER_IN;
              const outDelay = i * CHAR_STAGGER_OUT;

              return (
                <span
                  key={`${index}-${i}`}
                  className="inline-block"
                  style={{
                    opacity:
                      phase === "in"
                        ? 0
                        : phase === "out"
                        ? 1
                        : 1,
                    filter:
                      phase === "in"
                        ? "blur(3px)"
                        : phase === "out"
                        ? "blur(0px)"
                        : "blur(0px)",
                    animation:
                      phase === "in"
                        ? `stele-char-in ${FADE_DURATION}ms ease-out ${inDelay}ms forwards`
                        : phase === "out"
                        ? `stele-char-out ${FADE_DURATION}ms ease-in ${outDelay}ms forwards`
                        : "none",
                    minWidth: isSpace ? "0.3em" : undefined,
                  }}
                >
                  {isSpace ? "\u00A0" : ch}
                </span>
              );
            })}
          </p>
        </div>
      )}

      {/* CTA Button */}
      {showButton && (
        <div
          className="z-10"
          style={{
            animation: "stele-fade-in 2s ease-out forwards",
          }}
        >
          <Link
            href="/stele/prepare"
            className="inline-block px-10 py-4 border border-stele-bone-faint text-stele-bone text-sm tracking-[0.4em] hover:border-stele-ember hover:text-stele-ember transition-all duration-[1200ms]"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}
          >
            I &nbsp;U N D E R S T A N D
          </Link>
        </div>
      )}

      <style jsx>{`
        @keyframes stele-char-in {
          from {
            opacity: 0;
            filter: blur(3px);
          }
          to {
            opacity: 1;
            filter: blur(0px);
          }
        }
        @keyframes stele-char-out {
          from {
            opacity: 1;
            filter: blur(0px);
          }
          to {
            opacity: 0;
            filter: blur(2px);
          }
        }
        @keyframes stele-fade-in {
          from {
            opacity: 0;
            transform: translateY(16px);
            filter: blur(4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
            filter: blur(0);
          }
        }
      `}</style>
    </main>
  );
}
