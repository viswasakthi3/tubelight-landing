"use client";

import { motion } from "motion/react";
import { Reveal } from "./Reveal";

const POINTS = [
  {
    title: "Diagrams, not paragraphs",
    body: "Flows, cycles, timelines, anatomies — whatever shape the idea actually has in your head.",
  },
  {
    title: "Voice starts before the ink dries",
    body: "Narration and visual elements stream in parallel, so you hear the voice while the diagram takes shape.",
  },
  {
    title: "Nothing leaves your machine",
    body: "Explanations and history live locally on your device. The text you highlight is never stored.",
  },
];

export function NightBand() {
  return (
    <section className="relative overflow-hidden bg-night text-white">
      {/* Background ambient lighting */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(55% 45% at 20% 0%, rgba(240,164,40,.15), transparent 65%), radial-gradient(50% 50% at 85% 85%, rgba(108,76,241,.2), transparent 65%)",
        }}
      />

      <div className="relative mx-auto max-w-6xl px-6 py-20 md:py-28">
        <Reveal>
          <div className="max-w-2xl">
            <p className="text-sm font-semibold tracking-[0.14em] text-filament-2 uppercase">
              Built to be looked at
            </p>
            <h2 className="display mt-3 text-[2.1rem] text-white sm:text-[2.7rem]">
              It doesn&rsquo;t summarise. It draws.
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-white/70">
              Most tools hand you another wall of text to wade through. Tubelight builds the visual model
              your brain was trying to form — systems, flows, and concept maps with voice explanation.
            </p>
          </div>
        </Reveal>

        <div className="mt-12 grid gap-6 lg:grid-cols-12">
          {/* --- Systems / Architecture schematic vector UI --- */}
          <Reveal className="lg:col-span-7">
            <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-night-2 p-5 shadow-2xl sm:p-6">
              <div className="flex items-center justify-between border-b border-white/10 pb-3 text-xs">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="font-mono text-white/80">Tubelight Engine · Visual Pipeline</span>
                </div>
                <span className="rounded bg-white/10 px-2 py-0.5 font-mono text-[11px] text-filament-2">
                  Real-time Synthesizer
                </span>
              </div>

              {/* Vector Architecture Flowchart */}
              <div className="my-6 flex-1 rounded-xl border border-white/5 bg-[#0e0a16] p-4 sm:p-5">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-2 items-center">
                  {/* Step 1: Input text */}
                  <div className="flex flex-col gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-amber-300">
                      Step 1 · Input
                    </span>
                    <p className="text-xs font-semibold text-white">Highlighted Text</p>
                    <p className="text-[11px] text-white/60 truncate">&ldquo;The light reactions split water...&rdquo;</p>
                  </div>

                  {/* Arrow 1 */}
                  <div className="hidden sm:flex justify-center text-amber-400">
                    <svg className="w-5 h-5 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </div>

                  {/* Step 2: Synthesis Engine */}
                  <div className="flex flex-col gap-1.5 rounded-lg border border-violet/40 bg-violet/15 p-3">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-violet-2">
                      Step 2 · Core
                    </span>
                    <p className="text-xs font-semibold text-white">Visual Synthesis</p>
                    <p className="text-[11px] text-white/60">Vector Diagram + Audio Stream</p>
                  </div>
                </div>

                {/* Step 3: Dual Output Stream */}
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-white/10">
                  <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-emerald-300">1. Vector Canvas</span>
                      <span className="font-mono text-[10px] text-emerald-400">60 FPS Render</span>
                    </div>
                    <p className="mt-1 text-[11px] text-white/65">
                      Progressive SVG drawing with color-coded flow paths and anatomy callouts.
                    </p>
                  </div>

                  <div className="rounded-lg border border-sky-500/30 bg-sky-500/10 p-3">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-sky-300">2. Natural Voiceover</span>
                      <span className="font-mono text-[10px] text-sky-400">Low-latency TTS</span>
                    </div>
                    <p className="mt-1 text-[11px] text-white/65">
                      Synchronized audio narration matching the visual step currently drawing.
                    </p>
                  </div>
                </div>
              </div>

              {/* Bottom live status */}
              <div className="flex items-center justify-between pt-2 text-[12px] text-white/60">
                <span className="font-medium text-white">Systems, drawn as systems.</span>
                <span className="text-filament-2 font-mono text-[11px]">Zero text clutter</span>
              </div>
            </div>
          </Reveal>

          {/* --- Concept Map / Visual History UI --- */}
          <Reveal delay={0.1} className="lg:col-span-5">
            <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-night-2 p-5 shadow-2xl sm:p-6">
              <div className="flex items-center justify-between border-b border-white/10 pb-3 text-xs">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-violet" />
                  <span className="font-mono text-white/80">Local Knowledge Graph</span>
                </div>
                <span className="font-mono text-[11px] text-white/40">Saved on device</span>
              </div>

              {/* Visual concept nodes */}
              <div className="my-6 flex-1 space-y-2.5 rounded-xl border border-white/5 bg-[#0e0a16] p-4">
                <p className="text-[11px] font-mono text-white/50 uppercase tracking-wider">
                  Recent Explanations
                </p>

                <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 p-2.5 transition hover:bg-white/10">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-7 w-7 items-center justify-center rounded bg-amber-500/20 text-xs text-amber-300 font-bold">
                      🧠
                    </span>
                    <div>
                      <p className="text-xs font-medium text-white">Human Memory Stages</p>
                      <p className="text-[10px] text-white/50">4 slides · 0:45 audio</p>
                    </div>
                  </div>
                  <span className="rounded bg-white/10 px-2 py-0.5 text-[10px] font-mono text-white/70">
                    Reopen
                  </span>
                </div>

                <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 p-2.5 transition hover:bg-white/10">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-7 w-7 items-center justify-center rounded bg-emerald-500/20 text-xs text-emerald-300 font-bold">
                      🌱
                    </span>
                    <div>
                      <p className="text-xs font-medium text-white">Photosynthesis Calvin Cycle</p>
                      <p className="text-[10px] text-white/50">Vector diagram · 0:38 audio</p>
                    </div>
                  </div>
                  <span className="rounded bg-white/10 px-2 py-0.5 text-[10px] font-mono text-white/70">
                    Reopen
                  </span>
                </div>

                <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 p-2.5 transition hover:bg-white/10">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-7 w-7 items-center justify-center rounded bg-violet/20 text-xs text-violet-2 font-bold">
                      📈
                    </span>
                    <div>
                      <p className="text-xs font-medium text-white">Why Inflation Happens</p>
                      <p className="text-[10px] text-white/50">4 step slides · 0:52 audio</p>
                    </div>
                  </div>
                  <span className="rounded bg-white/10 px-2 py-0.5 text-[10px] font-mono text-white/70">
                    Reopen
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 text-[12px] text-white/60">
                <span className="font-semibold text-white">Everything you learned, kept.</span>
                <span className="text-white/40 text-[11px]">Instant 0ms access</span>
              </div>
            </div>
          </Reveal>
        </div>

        <div className="mt-14 grid gap-8 border-t border-white/10 pt-10 sm:grid-cols-3">
          {POINTS.map((point, i) => (
            <Reveal key={point.title} delay={i * 0.08}>
              <h3 className="text-[1.05rem] font-semibold text-white">{point.title}</h3>
              <p className="mt-2 text-[0.95rem] leading-relaxed text-white/60">{point.body}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
