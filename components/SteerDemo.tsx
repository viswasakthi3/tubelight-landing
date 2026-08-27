"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";

interface SteerMode {
  id: string;
  label: string;
  icon: string;
  title: string;
  summary: string;
  bullets: string[];
  chatReply: string;
}

const MODES: SteerMode[] = [
  {
    id: "analogy",
    label: "Real-world Analogy",
    icon: "🌍",
    title: "Think of inflation like a packed auction room.",
    summary: "When 10 bidders each get handed a stack of free cash, nobody gets richer — the paintings just sell for 10x higher.",
    bullets: [
      "More cash chasing the same fixed goods",
      "Suppliers raise prices to balance surging demand",
      "Your purchasing power drops unless your wages match",
    ],
    chatReply: "Explained as an auction room analogy with 3 core real-world takeaways.",
  },
  {
    id: "simpler",
    label: "Simpler (ELI5)",
    icon: "⚡",
    title: "Money becomes worth less over time.",
    summary: "A $10 bill buys a full pizza today. If prices go up 10%, that same $10 only buys 9 slices next year.",
    bullets: [
      "Prices climb slowly across everything",
      "You need more notes to buy identical items",
      "Happens gradually in healthy economies (~2%/year)",
    ],
    chatReply: "Simplified to basic purchasing power with pizza slices example.",
  },
  {
    id: "timeline",
    label: "Step-by-step Timeline",
    icon: "⏱️",
    title: "The 4-stage inflation chain reaction:",
    summary: "How a central bank decision ripples into grocery prices at your local store.",
    bullets: [
      "1. Central bank lowers rates & injects liquidity",
      "2. Businesses & consumers borrow and spend rapidly",
      "3. Raw materials & energy costs spike from demand",
      "4. Retail stores mark up final price tags",
    ],
    chatReply: "Constructed a chronological 4-stage chain reaction flow.",
  },
  {
    id: "deep",
    label: "Deep Mechanism",
    icon: "📐",
    title: "Demand-Pull vs. Cost-Push Dynamics",
    summary: "The macroeconomic equilibrium shift defined by Fisher's Equation: MV = PQ.",
    bullets: [
      "Money Supply (M) × Velocity (V) = Price Level (P) × Real Output (Q)",
      "Supply constraints shift AS curve leftwards",
      "Wage-price spiral locks in baseline expectations",
    ],
    chatReply: "Detailed quantitative macro equilibrium breakdown (MV = PQ).",
  },
];

export function SteerDemo() {
  const [activeId, setActiveId] = useState("analogy");
  const current = MODES.find((m) => m.id === activeId) || MODES[0];

  return (
    <div className="flex flex-col gap-4 rounded-2xl bg-white/95 p-4 text-ink shadow-sm ring-1 ring-line/80 backdrop-blur-sm sm:p-5">
      {/* Mode switcher pills */}
      <div className="flex flex-wrap gap-1.5 border-b border-line pb-3.5">
        {MODES.map((mode) => {
          const isActive = mode.id === activeId;
          return (
            <button
              key={mode.id}
              type="button"
              onClick={() => setActiveId(mode.id)}
              className={[
                "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-semibold transition-all cursor-pointer",
                isActive
                  ? "bg-violet text-white shadow-sm"
                  : "bg-paper-2 text-ink-2 hover:bg-paper-3 hover:text-ink",
              ].join(" ")}
            >
              <span>{mode.icon}</span>
              <span>{mode.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main explanation card & Chat side-by-side on larger screens */}
      <div className="grid gap-4 sm:grid-cols-12">
        <div className="sm:col-span-7 flex flex-col justify-between rounded-xl bg-paper-2/70 p-4 ring-1 ring-line">
          <AnimatePresence mode="wait">
            <motion.div
              key={current.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.22 }}
              className="space-y-2.5"
            >
              <div className="flex items-center gap-2">
                <span className="rounded bg-violet/10 px-2 py-0.5 text-[11px] font-bold text-violet uppercase tracking-wider">
                  {current.label}
                </span>
              </div>
              <h4 className="text-[1.05rem] font-bold leading-snug text-ink">{current.title}</h4>
              <p className="text-[12.5px] leading-relaxed text-ink-2">{current.summary}</p>
              
              <ul className="mt-2.5 space-y-1.5 border-t border-line/60 pt-2.5">
                {current.bullets.map((b, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-[12px] text-ink-2">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-violet" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          </AnimatePresence>

          <div className="mt-3 flex items-center justify-between border-t border-line/60 pt-2.5 text-[11px] text-ink-3">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Re-drawn in 1.2s
            </span>
            <span className="font-mono text-violet font-medium">One-click re-steer</span>
          </div>
        </div>

        {/* Side Chat / Follow-up mock */}
        <div className="sm:col-span-5 flex flex-col justify-between rounded-xl bg-white p-3 ring-1 ring-line">
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-ink-3 uppercase tracking-wider">
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5 text-violet">
                <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
              </svg>
              Side Chat
            </div>
            
            <div className="rounded-lg bg-paper p-2 text-[11px] text-ink-2">
              <p className="font-semibold text-ink text-[11px]">You</p>
              <p className="mt-0.5">&ldquo;Can you explain it as a {current.label.toLowerCase()}?&rdquo;</p>
            </div>

            <div className="rounded-lg bg-violet-soft/70 p-2 text-[11px] text-violet">
              <p className="font-semibold text-violet text-[11px]">Tubelight</p>
              <p className="mt-0.5 text-ink-2 leading-relaxed">{current.chatReply}</p>
            </div>
          </div>

          <div className="mt-2.5 flex items-center gap-1.5 rounded-lg border border-line bg-paper px-2.5 py-1.5">
            <input
              type="text"
              readOnly
              value="Ask a follow-up..."
              className="w-full bg-transparent text-[11px] text-ink-3 outline-none cursor-default"
            />
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-violet text-white text-[10px]">
              ↑
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
