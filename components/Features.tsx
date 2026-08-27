import Image from "next/image";
import { LiveWaveform } from "./LiveWaveform";
import { Reveal } from "./Reveal";
import { SteerDemo } from "./SteerDemo";

const SMALL = [
  {
    title: "Snaps beside your work",
    body: "Your window moves left, the panel slides in right. Drag the edge to resize — nothing gets covered up.",
  },
  {
    title: "No account, no setup",
    body: "Install it and the shortcut works. A device ID tracks your daily allowance — there is nothing to sign into.",
  },
  {
    title: "Your reading stays yours",
    body: "The text you select is never logged or stored on the server. History lives on your own machine.",
  },
];

export function Features() {
  return (
    <section id="features" className="relative mx-auto max-w-6xl px-6 py-20 md:py-28">
      <Reveal>
        <div className="max-w-2xl">
          <p className="text-sm font-semibold tracking-[0.14em] text-violet uppercase">What you get</p>
          <h2 className="display mt-3 text-[2.1rem] text-ink sm:text-[2.7rem]">
            Six ways it beats another search tab.
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-ink-2">
            Everything below is designed for visual thinkers — fast, clear, and interactive.
          </p>
        </div>
      </Reveal>

      <div className="mt-12 grid gap-5 lg:grid-cols-12">
        {/* --- Type a topic ------------------------------------------------ */}
        <Reveal className="lg:col-span-7">
          <article className="flex h-full flex-col overflow-hidden rounded-3xl border border-line bg-[linear-gradient(180deg,#fffdf9_0%,#f8f2e8_100%)] p-6 shadow-lift sm:p-8">
            <span className="w-fit rounded-full bg-filament-soft px-3 py-1 text-[12px] font-semibold text-[#9a6410]">
              Nothing to highlight?
            </span>
            <h3 className="display mt-4 text-[1.6rem] text-ink">Just type the topic.</h3>
            <p className="mt-2.5 max-w-md text-[0.98rem] leading-relaxed text-ink-2">
              Suggestions appear as you type, so &ldquo;inflation&rdquo; asks whether you want the
              underlying causes, current rates, or real-world analogies. Pick a speed and go.
            </p>
            <div className="mt-6 -mb-14 overflow-hidden rounded-t-2xl ring-1 ring-line shadow-sm">
              <Image
                src="/shots/f-topics.webp"
                alt="Tubelight's topic box with the question 'why does inflation happen?' typed in, speed options, and a scrollable list of suggested topics."
                width={715}
                height={825}
                quality={95}
                sizes="(max-width: 1024px) 100vw, 620px"
                className="w-full object-cover object-top"
                style={{ maxHeight: 320, objectFit: "cover" }}
              />
            </div>
          </article>
        </Reveal>

        {/* --- Slides ------------------------------------------------------ */}
        <Reveal delay={0.08} className="lg:col-span-5">
          <article className="flex h-full flex-col overflow-hidden rounded-3xl border border-[#cfe6cd] bg-[linear-gradient(180deg,#f4fbf3_0%,#e8f5e6_100%)] p-6 shadow-lift sm:p-8">
            <span className="w-fit rounded-full bg-[#d8efd5] px-3 py-1 text-[12px] font-semibold text-[#2f6b3c]">
              Step by step
            </span>
            <h3 className="display mt-4 text-[1.6rem] text-ink">Slides you can actually follow.</h3>
            <p className="mt-2.5 text-[0.98rem] leading-relaxed text-ink-2">
              Big idea broken into numbered panels, each one drawn and captioned, narrated in order.
            </p>
            <div className="mt-6 overflow-hidden rounded-2xl ring-1 ring-[#cfe6cd] shadow-sm">
              <Image
                src="/shots/f-slides.webp"
                alt="Four numbered illustrated slides explaining why inflation happens, with an audio player underneath."
                width={770}
                height={850}
                quality={95}
                sizes="(max-width: 1024px) 100vw, 420px"
                className="w-full"
              />
            </div>
          </article>
        </Reveal>

        {/* --- Steer it ---------------------------------------------------- */}
        <Reveal delay={0.04} className="lg:col-span-7">
          <article className="relative flex h-full flex-col overflow-hidden rounded-3xl border border-line bg-[linear-gradient(180deg,#faf7f2_0%,#f3ece0_100%)] p-6 shadow-lift sm:p-8">
            <div className="relative">
              <span className="w-fit rounded-full bg-violet-soft px-3 py-1 text-[12px] font-semibold text-violet">
                Didn&rsquo;t land?
              </span>
              <h3 className="display mt-4 text-[1.6rem] text-ink">Ask for it a different way.</h3>
              <p className="mt-2.5 max-w-lg text-[0.98rem] leading-relaxed text-ink-2">
                &ldquo;Simpler.&rdquo; &ldquo;As a timeline.&rdquo; &ldquo;Give me a real-world
                analogy.&rdquo; The same idea gets redrawn until it clicks — and you can keep asking
                follow-ups in the side chat.
              </p>
              <div className="mt-6">
                <SteerDemo />
              </div>
            </div>
          </article>
        </Reveal>

        {/* --- Voice & Visuals --------------------------------------------- */}
        <Reveal delay={0.12} className="lg:col-span-5">
          <article className="flex h-full flex-col overflow-hidden rounded-3xl border border-[#cadcf2] bg-[linear-gradient(180deg,#f4f8fd_0%,#e7f0fb_100%)] p-6 shadow-lift sm:p-8">
            <span className="w-fit rounded-full bg-[#d6e6f8] px-3 py-1 text-[12px] font-semibold text-[#1f5a99]">
              Watch and listen
            </span>
            <h3 className="display mt-4 text-[1.6rem] text-ink">It reads to you while it draws.</h3>
            <p className="mt-2.5 text-[0.98rem] leading-relaxed text-ink-2">
              Picture and narration are generated at the same time, so the voice is usually talking
              before the last arrow lands.
            </p>

            <div className="mt-6 rounded-2xl bg-white/80 p-3 ring-1 ring-[#cadcf2] shadow-sm">
              <Image
                src="/shots/f-memory-panel.webp"
                alt="Tubelight visual explanation of how human memory works with brain anatomy diagram, numbered steps, and audio player."
                width={1225}
                height={1070}
                quality={95}
                sizes="(max-width: 1024px) 100vw, 400px"
                className="w-full rounded-xl shadow-xs"
              />
              <div className="mt-3 flex items-center gap-3 rounded-xl bg-white px-3 py-2.5 ring-1 ring-[#cadcf2]">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#2C7BD6] text-white shadow-xs">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5" aria-hidden="true">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </span>
                <LiveWaveform className="h-8 flex-1 overflow-hidden" color="bg-[#2C7BD6]/70" />
                <span className="shrink-0 text-[11px] tabular-nums font-mono text-ink-3">0:18 / 0:45</span>
              </div>
            </div>
          </article>
        </Reveal>
      </div>

      <div className="mt-5 grid gap-5 sm:grid-cols-3">
        {SMALL.map((item, i) => (
          <Reveal key={item.title} delay={i * 0.06}>
            <article className="h-full rounded-2xl border border-line bg-white p-6 shadow-xs">
              <h3 className="text-[1.02rem] font-semibold text-ink">{item.title}</h3>
              <p className="mt-2 text-[0.95rem] leading-relaxed text-ink-2">{item.body}</p>
            </article>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
