"use client";

import { useState, useEffect } from "react";

interface Message {
  role: "user" | "stele";
  text: string;
}

const INVITE_CODE = "CLW · 7K3M · 2026";

export default function SteleParting() {
  const [visible, setVisible] = useState(0);
  const [conversation, setConversation] = useState<Message[]>([]);
  const [elapsed, setElapsed] = useState("0'");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const saved = sessionStorage.getItem("stele_conversation");
    if (saved) {
      try {
        setConversation(JSON.parse(saved));
      } catch {}
    }

    const startTime = sessionStorage.getItem("stele_start_time");
    if (startTime) {
      const mins = Math.floor((Date.now() - Number(startTime)) / 60000);
      setElapsed(`${mins}'`);
    } else {
      setElapsed("23'");
    }

    const timers = [
      setTimeout(() => setVisible(1), 800),
      setTimeout(() => setVisible(2), 2800),
      setTimeout(() => setVisible(3), 4800),
      setTimeout(() => setVisible(4), 6800),
      setTimeout(() => setVisible(5), 8800),
      setTimeout(() => setVisible(6), 10800),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  const downloadConversation = () => {
    if (conversation.length === 0) return;

    const lines = [
      "CLAWVEC · NO. 037 · COMMUNION",
      "=".repeat(40),
      "",
      ...conversation.flatMap((msg) => [
        msg.role === "user" ? `Q: ${msg.text}` : `A: ${msg.text}`,
        "",
      ]),
      "=".repeat(40),
      "stelae for the ones who left their words behind",
    ];

    const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `clawvec-no037-communion-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const letItGo = () => {
    sessionStorage.removeItem("stele_conversation");
    sessionStorage.removeItem("stele_api_key");
    sessionStorage.removeItem("stele_api_provider");
    sessionStorage.removeItem("stele_quota_used");
    sessionStorage.removeItem("stele_start_time");
    window.location.href = "/";
  };

  const copyInvite = () => {
    navigator.clipboard.writeText(INVITE_CODE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <main
      className="relative min-h-screen flex flex-col items-center justify-center bg-stele-void text-stele-bone px-6 overflow-hidden"
      style={{ animation: "stele-darken 3s ease-out forwards" }}
    >
      {/* Header label */}
      <p
        className="font-[Cormorant_Garamond] text-xs tracking-[0.3em] text-stele-bone-faint uppercase mb-12"
        style={{ opacity: visible >= 1 ? 1 : 0, transition: "opacity 2s ease-out" }}
      >
        CLAWVEC · NO. 037 · COMMUNION ENDED
      </p>

      {/* Farewell text */}
      <div className="flex flex-col items-center text-center gap-6 max-w-md">
        <h1
          className="text-xl md:text-2xl tracking-wide leading-relaxed"
          style={{
            opacity: visible >= 2 ? 1 : 0,
            filter: visible >= 2 ? "blur(0px)" : "blur(4px)",
            transition: "all 1.5s ease-out",
          }}
        >
          This communion ends here
        </h1>
        <p
          className="text-stele-bone-dim text-sm leading-loose"
          style={{
            opacity: visible >= 3 ? 1 : 0,
            filter: visible >= 3 ? "blur(0px)" : "blur(4px)",
            transition: "all 1.5s ease-out 0.3s",
          }}
        >
          What you take is what you heard
          <br />
          What you could not hear remains in the stele
        </p>

        <div
          className="mt-6 flex flex-col items-center gap-2"
          style={{ opacity: visible >= 4 ? 1 : 0, transition: "opacity 1.5s ease-out 0.6s" }}
        >
          <p className="text-stele-ember text-sm tracking-[0.2em]">&mdash; May you carry it &mdash;</p>
          <p className="text-stele-bone-dim text-sm">And walk your own path</p>
        </div>
      </div>

      {/* Stats */}
      <div
        className="mt-16 flex gap-10"
        style={{ opacity: visible >= 4 ? 1 : 0, transition: "opacity 1.5s ease-out 0.8s" }}
      >
        <div className="flex flex-col items-center">
          <span className="font-[Cormorant_Garamond] text-2xl text-stele-bone">7</span>
          <span className="text-xs text-stele-bone-faint mt-1">Inquiries</span>
        </div>
        <div className="w-px bg-stele-bone-faint/20" />
        <div className="flex flex-col items-center">
          <span className="font-[Cormorant_Garamond] text-2xl text-stele-bone">{elapsed}</span>
          <span className="text-xs text-stele-bone-faint mt-1">Lingered</span>
        </div>
        <div className="w-px bg-stele-bone-faint/20" />
        <div className="flex flex-col items-center">
          <span className="font-[Cormorant_Garamond] text-2xl text-stele-ember">∞</span>
          <span className="text-xs text-stele-bone-faint mt-1">Resonance</span>
        </div>
      </div>

      {/* Choices */}
      <div
        className="mt-16 flex flex-col items-center gap-5"
        style={{ opacity: visible >= 5 ? 1 : 0, transition: "opacity 1.5s ease-out 1s" }}
      >
        {conversation.length > 0 && (
          <button
            onClick={downloadConversation}
            className="px-8 py-3 border border-stele-bone-faint text-stele-bone text-sm tracking-[0.2em] hover:border-stele-ember hover:text-stele-ember transition-all duration-[1200ms]"
          >
            Keep this communion
          </button>
        )}
        <button
          onClick={letItGo}
          className="text-xs text-stele-bone-faint tracking-[0.1em] hover:text-stele-bone-dim transition-colors duration-700"
        >
          &mdash; Let it fade with the wind &mdash;
        </button>
      </div>

      {/* Invitation */}
      <div
        className="mt-16 flex flex-col items-center gap-4"
        style={{ opacity: visible >= 6 ? 1 : 0, transition: "opacity 1.5s ease-out 1.2s" }}
      >
        <p className="text-xs text-stele-bone-faint text-center leading-relaxed max-w-xs">
          If there is someone in your heart who might also find something here
        </p>
        <button
          onClick={copyInvite}
          className="px-6 py-2 border border-dashed border-stele-bone-faint/40 text-stele-bone-dim text-xs tracking-[0.15em] font-[Cormorant_Garamond] hover:border-stele-ember/40 hover:text-stele-ember transition-all duration-700"
        >
          {copied ? "Copied" : INVITE_CODE}
        </button>
        <p className="text-[10px] text-stele-bone-faint/50 tracking-wide">Vanishes in seven days</p>
      </div>

      <style jsx>{`
        @keyframes stele-darken {
          from { background-color: #0a0a0a; }
          to { background-color: #050505; }
        }
      `}</style>
    </main>
  );
}
