"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useInViewport } from "@/lib/useInViewport";

export type Phase = "read" | "select" | "press" | "open" | "draw";

const TIMELINE: { at: number; phase: Phase }[] = [
  { at: 0, phase: "read" },
  { at: 900, phase: "select" },
  { at: 2200, phase: "press" },
  { at: 2850, phase: "open" },
  { at: 3500, phase: "draw" },
];
const LOOP_MS = 11000;

interface AltEDemoProps {
  onPhase?: (phase: Phase) => void;
  overridePhase?: Phase | null;
}

export function AltEDemo({ onPhase, overridePhase }: AltEDemoProps) {
  const reduce = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);
  const inView = useInViewport(containerRef, { offset: 80 });
  const [phase, setPhase] = useState<Phase>("read");
  const [cycle, setCycle] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (overridePhase) {
      setPhase(overridePhase);
    }
  }, [overridePhase]);

  useEffect(() => {
    onPhase?.(phase);
  }, [phase, onPhase]);

  useEffect(() => {
    if (reduce) {
      setPhase("draw");
      return;
    }
    if (!inView || isPaused || overridePhase) return;

    const timers = TIMELINE.map(({ at, phase: next }) =>
      window.setTimeout(() => setPhase(next), at),
    );
    const loop = window.setTimeout(() => setCycle((c) => c + 1), LOOP_MS);

    return () => {
      timers.forEach(window.clearTimeout);
      window.clearTimeout(loop);
    };
  }, [cycle, inView, reduce, isPaused, overridePhase]);

  const selected = phase !== "read";
  const pressed = phase === "press";
  const panelOpen = phase === "open" || phase === "draw";
  const drawing = phase === "draw";

  return (
    <div ref={containerRef} className="relative">
      <div className="shadow-frame relative overflow-hidden rounded-[22px] bg-paper-3/70 p-2 ring-1 ring-line-strong/70 sm:rounded-[28px] sm:p-3">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(60% 80% at 15% 10%, rgba(240,164,40,.24), transparent 60%), radial-gradient(70% 90% at 95% 100%, rgba(108,76,241,.25), transparent 60%)",
          }}
        />

        <div className="demo-stage relative h-[540px] sm:h-[430px] md:h-[470px]" data-open={panelOpen}>
          {/* ---------------- The document you were reading ---------------- */}
          <div className="relative rounded-2xl bg-white ring-1 ring-line shadow-xs">
            <div className="flex items-center gap-2 border-b border-line bg-paper px-3 py-2">
              <span className="flex gap-1.5" aria-hidden="true">
                <i className="h-2.5 w-2.5 rounded-full bg-[#ef6a5b]" />
                <i className="h-2.5 w-2.5 rounded-full bg-[#f4bf50]" />
                <i className="h-2.5 w-2.5 rounded-full bg-[#5fc078]" />
              </span>
              <span className="truncate text-[11px] font-medium text-ink-3">
                Photosynthesis — Biology 101.pdf
              </span>
            </div>

            <div className="space-y-2.5 p-4 sm:p-5">
              <p className="display text-base text-ink sm:text-lg">Chapter 4 — Making food from light</p>
              <p className="text-[12.5px] leading-relaxed text-ink-2 sm:text-[13.5px]">
                Plants do not eat. They build. Inside every leaf sits a factory that takes three
                cheap ingredients and turns them into fuel.{" "}
                <span className="marker rounded-[3px] px-0.5 text-ink" data-on={selected}>
                  The light-dependent reactions split water and store energy in ATP and NADPH.
                </span>{" "}
                What comes out the other side is sugar — and the oxygen you are breathing right now.
              </p>
              <p className="text-[12.5px] leading-relaxed text-ink-3 sm:text-[13.5px]">
                The process runs in two stages, and the second one does not need light at all, which
                is why the old name for it stuck around long after it stopped being accurate.
                Textbooks still print the diagram as a single loop, which is where most of the
                confusion starts.
              </p>
              <p className="hidden text-[12.5px] leading-relaxed text-ink-3 sm:block sm:text-[13.5px]">
                4.2 — The Calvin cycle takes the ATP and NADPH banked in stage one and fixes carbon
                into a three-carbon sugar. Six turns of the cycle produce one glucose molecule, at a
                cost the plant is entirely willing to pay.
              </p>
            </div>

            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-white via-white/85 to-transparent"
            />

            <motion.div
              animate={pressed ? { scale: 1.05, y: -2 } : { scale: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className={[
                "absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-paper/95 px-3.5 py-2 ring-1 backdrop-blur-sm transition-all duration-300",
                pressed
                  ? "ring-filament shadow-[0_0_20px_rgba(240,164,40,0.4)]"
                  : "ring-line shadow-sm",
              ].join(" ")}
            >
              <span className="text-[11px] font-medium text-ink-3">Press</span>
              <kbd className="keycap" data-pressed={pressed}>
                Alt
              </kbd>
              <span className="text-[11px] font-bold text-ink-3">+</span>
              <kbd className="keycap" data-pressed={pressed}>
                E
              </kbd>
            </motion.div>
          </div>

          {/* ---------------- The Tubelight panel ---------------- */}
          <div className="demo-panel relative rounded-2xl bg-white ring-1 ring-violet/25 shadow-lg">
            <div className="flex h-full w-full min-w-[248px] flex-col gap-2 p-3">
              <div className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-violet text-[10px] font-bold text-white shadow-xs">
                  T
                </span>
                <span className="text-[11px] font-semibold text-ink">Tubelight</span>
                <span className="ml-auto rounded-full bg-violet-soft px-2 py-0.5 text-[10px] font-medium text-violet">
                  Visual explain
                </span>
              </div>

              <p className="truncate rounded-lg bg-paper-2 px-2.5 py-1.5 text-[11px] text-ink-2">
                &ldquo;The light-dependent reactions split water&hellip;&rdquo;
              </p>

              <div className="relative flex min-h-0 flex-1 items-center overflow-hidden rounded-xl bg-[#fdfaf4] p-1 ring-1 ring-line">
                <PhotosynthesisDiagram drawing={drawing} />
              </div>

              <AnimatePresence>
                {drawing && (
                  <motion.p
                    initial={{ opacity: 0, y: 3 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7, duration: 0.4 }}
                    className="hidden text-[11px] leading-snug text-ink-2 sm:block bg-paper-2/60 rounded-lg p-1.5 border border-line/60"
                  >
                    &ldquo;Light knocks an electron loose from water. That electron is the energy the
                    leaf banks as ATP.&rdquo;
                  </motion.p>
                )}
              </AnimatePresence>

              <div className="mt-auto flex items-center gap-2 rounded-xl bg-paper-2 px-2.5 py-2 border border-line/50">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet text-white shadow-xs">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="h-3 w-3" aria-hidden="true">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </span>
                <Waveform active={drawing} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {!reduce && (
        <div className="absolute -bottom-3 right-4 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsPaused((p) => !p)}
            className="shadow-lift rounded-full bg-paper px-3 py-1.5 text-[11px] font-semibold text-ink-2 ring-1 ring-line transition hover:bg-paper-2 cursor-pointer"
            title={isPaused ? "Resume animation" : "Pause animation"}
          >
            {isPaused ? "▶ Resume" : "⏸ Pause"}
          </button>
          <button
            type="button"
            onClick={() => {
              setIsPaused(false);
              setCycle((c) => c + 1);
            }}
            className="shadow-lift rounded-full bg-ink px-3.5 py-1.5 text-[11px] font-semibold text-paper transition hover:bg-violet cursor-pointer"
          >
            ↻ Replay
          </button>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------------ */

function Waveform({ active }: { active: boolean }) {
  const bars = [7, 12, 18, 10, 22, 14, 9, 17, 24, 12, 8, 15, 20, 11, 6, 13, 19, 9];
  return (
    <div className="flex h-6 flex-1 items-center gap-[3px] overflow-hidden" aria-hidden="true">
      {bars.map((h, i) => (
        <span
          key={i}
          className="w-[3px] shrink-0 rounded-full bg-violet/75"
          style={{
            height: `${h}px`,
            transformOrigin: "center",
            animation: active ? `eq ${600 + (i % 5) * 120}ms ease-in-out ${i * 40}ms infinite` : "none",
            opacity: active ? 1 : 0.35,
          }}
        />
      ))}
    </div>
  );
}

function PhotosynthesisDiagram({ drawing }: { drawing: boolean }) {
  const stroke = { duration: 1.0, ease: [0.4, 0, 0.2, 1] as const };

  return (
    <svg
      viewBox="0 0 320 168"
      preserveAspectRatio="xMidYMid meet"
      className="h-full max-h-full w-full"
      role="img"
      aria-label="Diagram: sunlight and water entering a leaf, sugar and oxygen coming out"
    >
      {/* Sun element */}
      <motion.g
        initial={{ opacity: 0, scale: 0.7 }}
        animate={drawing ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.7 }}
        transition={{ duration: 0.5 }}
        style={{ transformOrigin: "44px 42px" }}
      >
        <circle cx="44" cy="42" r="16" fill="#FFD166" stroke="#E0912A" strokeWidth="2" />
        {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
          <line
            key={deg}
            x1={44 + Math.cos((deg * Math.PI) / 180) * 21}
            y1={42 + Math.sin((deg * Math.PI) / 180) * 21}
            x2={44 + Math.cos((deg * Math.PI) / 180) * 27}
            y2={42 + Math.sin((deg * Math.PI) / 180) * 27}
            stroke="#E0912A"
            strokeWidth="2.4"
            strokeLinecap="round"
          />
        ))}
      </motion.g>

      {/* Leaf shape */}
      <motion.path
        d="M150 44c34 0 56 22 56 48s-22 44-56 44-56-18-56-44 22-48 56-48z"
        fill="#D7F0D2"
        stroke="#3E8E4E"
        strokeWidth="2.6"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={drawing ? { pathLength: 1, opacity: 1 } : { pathLength: 0, opacity: 0 }}
        transition={{ ...stroke, delay: 0.2 }}
      />
      
      {/* Internal vein structure */}
      <motion.path
        d="M150 50v82M150 78l-26-16M150 78l26-16M150 104l-24-15M150 104l24-15"
        fill="none"
        stroke="#3E8E4E"
        strokeWidth="2"
        strokeLinecap="round"
        initial={{ opacity: 0 }}
        animate={drawing ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 0.5, delay: 0.8 }}
      />

      {/* Sunlight Ray Arrow */}
      <motion.path
        d="M64 56 L104 76"
        stroke="#E0912A"
        strokeWidth="2.6"
        strokeLinecap="round"
        markerEnd="url(#arrow-amber)"
        initial={{ pathLength: 0 }}
        animate={drawing ? { pathLength: 1 } : { pathLength: 0 }}
        transition={{ ...stroke, delay: 0.45 }}
      />

      {/* H2O Water Input */}
      <motion.g
        initial={{ opacity: 0, x: -8 }}
        animate={drawing ? { opacity: 1, x: 0 } : { opacity: 0, x: -8 }}
        transition={{ duration: 0.4, delay: 0.9 }}
      >
        <text x="16" y="122" fontSize="13" fontWeight="700" fill="#2C7BD6" fontFamily="ui-sans-serif, system-ui">
          H₂O
        </text>
        <path d="M58 118 L96 112" stroke="#2C7BD6" strokeWidth="2.6" strokeLinecap="round" markerEnd="url(#arrow-blue)" />
      </motion.g>

      {/* Sugar Output */}
      <motion.g
        initial={{ opacity: 0, x: 8 }}
        animate={drawing ? { opacity: 1, x: 0 } : { opacity: 0, x: 8 }}
        transition={{ duration: 0.4, delay: 1.2 }}
      >
        <path d="M210 74 L244 66" stroke="#E0912A" strokeWidth="2.6" strokeLinecap="round" markerEnd="url(#arrow-amber)" />
        <text x="250" y="70" fontSize="12" fontWeight="700" fill="#B8721C" fontFamily="ui-sans-serif, system-ui">
          sugar (C₆H₁₂O₆)
        </text>
      </motion.g>

      {/* O2 Oxygen Output */}
      <motion.g
        initial={{ opacity: 0, x: 8 }}
        animate={drawing ? { opacity: 1, x: 0 } : { opacity: 0, x: 8 }}
        transition={{ duration: 0.4, delay: 1.45 }}
      >
        <path d="M208 112 L244 120" stroke="#3E8E4E" strokeWidth="2.6" strokeLinecap="round" markerEnd="url(#arrow-green)" />
        <text x="250" y="126" fontSize="13" fontWeight="700" fill="#2F7A41" fontFamily="ui-sans-serif, system-ui">
          O₂ (breathable)
        </text>
      </motion.g>

      <defs>
        {(
          [
            ["arrow-amber", "#E0912A"],
            ["arrow-blue", "#2C7BD6"],
            ["arrow-green", "#3E8E4E"],
          ] as const
        ).map(([id, color]) => (
          <marker
            key={id}
            id={id}
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="5"
            markerHeight="5"
            orient="auto-start-reverse"
          >
            <path d="M0 0 L10 5 L0 10 z" fill={color} />
          </marker>
        ))}
      </defs>
    </svg>
  );
}
