import Image from "next/image";
import { Reveal } from "./Reveal";

const POINTS = [
  {
    title: "Diagrams, not paragraphs",
    body: "Flows, cycles, timelines, anatomies — whatever shape the idea actually has.",
  },
  {
    title: "Voice starts before the ink dries",
    body: "Narration and picture are generated in parallel, so you hear it while you watch it appear.",
  },
  {
    title: "Nothing leaves your machine",
    body: "Explanations are stored locally. The backend never logs the text you selected.",
  },
];

export function NightBand() {
  return (
    <section className="relative overflow-hidden bg-night text-white">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(55% 45% at 18% 0%, rgba(108,76,241,.38), transparent 62%), radial-gradient(50% 50% at 88% 90%, rgba(240,164,40,.18), transparent 62%)",
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
            <p className="mt-4 text-lg leading-relaxed text-white/65">
              Most tools hand you another block of text to read. Tubelight hands you the picture your
              brain was trying to build anyway — architecture flows, concept maps, labelled systems —
              and talks you through it.
            </p>
          </div>
        </Reveal>

        <div className="mt-12 grid gap-6 lg:grid-cols-12">
          <Reveal className="lg:col-span-7">
            <figure className="overflow-hidden rounded-2xl bg-night-2 p-1.5 ring-1 ring-white/10">
              <Image
                src="/shots/f-schematic.webp"
                alt="Tubelight showing a glowing system architecture flowchart with a synchronised transcript panel and audio waveform."
                width={1063}
                height={668}
                sizes="(max-width: 1024px) 100vw, 640px"
                className="w-full rounded-xl"
              />
              <figcaption className="px-4 py-3.5 text-sm text-white/60">
                <span className="font-semibold text-white">Systems, drawn as systems.</span> Ask how
                something works and get the wiring diagram, narrated line by line.
              </figcaption>
            </figure>
          </Reveal>

          <Reveal delay={0.1} className="lg:col-span-5">
            <figure className="flex h-full flex-col overflow-hidden rounded-2xl bg-night-2 p-1.5 ring-1 ring-white/10">
              <Image
                src="/shots/f-map.webp"
                alt="A branching concept map of a topic beside a searchable history of past explanations."
                width={1099}
                height={706}
                sizes="(max-width: 1024px) 100vw, 460px"
                className="min-h-0 w-full flex-1 rounded-xl object-cover object-left-top"
              />
              <figcaption className="px-4 py-3.5 text-sm text-white/60">
                <span className="font-semibold text-white">Everything you learned, kept.</span> Past
                explanations reopen instantly — no re-generating, no waiting.
              </figcaption>
            </figure>
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
