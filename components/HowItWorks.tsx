"use client";

import { useCallback, useState } from "react";
import { AltEDemo, type Phase } from "./AltEDemo";

const STEPS = [
  {
    label: "Highlight it",
    detail: "Any text, in any app — browser, PDF, Word, chat, code.",
    phases: ["read", "select"] as Phase[],
  },
  {
    label: "Press Alt+E",
    detail: "One shortcut, anywhere in Windows. Nothing to set up first.",
    phases: ["press"] as Phase[],
  },
  {
    label: "See it and hear it",
    detail: "Your window snaps left. A diagram draws itself while a voice walks you through it.",
    phases: ["open", "draw"] as Phase[],
  },
];

export function HowItWorks() {
  const [phase, setPhase] = useState<Phase>("read");
  const onPhase = useCallback((next: Phase) => setPhase(next), []);
  const activeIndex = STEPS.findIndex((step) => step.phases.includes(phase));

  return (
    <section id="how" className="relative mx-auto max-w-6xl px-6 py-20 md:py-28">
      <div className="max-w-2xl">
        <p className="text-sm font-semibold tracking-[0.14em] text-violet uppercase">How it works</p>
        <h2 className="display mt-3 text-[2.1rem] text-ink sm:text-[2.7rem]">
          Three seconds from &ldquo;what?&rdquo; to &ldquo;oh.&rdquo;
        </h2>
        <p className="mt-4 text-lg leading-relaxed text-ink-2">
          No new tab, no prompt to write, no wall of text to wade through. Watch it happen.
        </p>
      </div>

      <div className="mt-12 grid items-center gap-10 lg:grid-cols-12 lg:gap-14">
        <ol className="order-2 space-y-3 lg:order-1 lg:col-span-4">
          {STEPS.map((step, index) => {
            const active = index === activeIndex;
            return (
              <li
                key={step.label}
                aria-current={active ? "step" : undefined}
                className={[
                  "relative rounded-2xl border p-5 transition-all duration-500",
                  active
                    ? "border-violet/35 bg-white shadow-lift"
                    : "border-line bg-paper-2/50",
                ].join(" ")}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={[
                      "flex h-7 w-7 items-center justify-center rounded-full text-[13px] font-bold transition-colors duration-500",
                      active ? "bg-violet text-white" : "bg-paper-3 text-ink-3",
                    ].join(" ")}
                  >
                    {index + 1}
                  </span>
                  <h3 className="text-[1.05rem] font-semibold text-ink">{step.label}</h3>
                </div>
                <p className="mt-2 pl-10 text-[0.95rem] leading-relaxed text-ink-2">{step.detail}</p>
                <span
                  aria-hidden="true"
                  className={[
                    "absolute inset-x-5 bottom-0 h-px origin-left bg-gradient-to-r from-violet to-filament transition-transform duration-700",
                    active ? "scale-x-100" : "scale-x-0",
                  ].join(" ")}
                />
              </li>
            );
          })}
        </ol>

        <div className="order-1 lg:order-2 lg:col-span-8">
          <AltEDemo onPhase={onPhase} />
        </div>
      </div>
    </section>
  );
}
