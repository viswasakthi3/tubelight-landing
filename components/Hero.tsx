import Image from "next/image";
import { WaitlistForm } from "./WaitlistForm";

const WORKS_IN = ["Chrome", "Edge", "PDFs", "Word", "Slack", "Notion", "VS Code"];

export function Hero() {
  return (
    <section className="relative px-6 pb-16 pt-6 sm:pt-10" aria-label="Hero">
      <div className="mx-auto max-w-3xl text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-line bg-white/70 px-3.5 py-1.5 text-[13px] font-medium text-ink-2 backdrop-blur-sm">
          <span className="relative flex h-2 w-2" aria-hidden="true">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-filament opacity-70" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-filament" />
          </span>
          Visual Learning Platform · Windows 10 &amp; 11 · Private beta
        </span>

        <h1 className="display mt-7 text-[2.6rem] leading-[1.04] text-ink sm:text-[3.6rem] md:text-[4.15rem]">
          Learn complex things fast.
          <span className="mt-2 block text-violet">
            Press <kbd className="keycap keycap-inline">Alt</kbd>
            <span className="mx-2.5 align-[0.22em] text-[0.42em] text-ink-3">+</span>
            <kbd className="keycap keycap-inline">E</kbd>
          </span>
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-ink-2 sm:text-xl">
          Tubelight is the visual learning platform that explains whatever you highlight — an
          interactive UI diagram drawn in real time and a synchronized voice walking you through it,
          right next to what you are already reading.
        </p>

        <div className="mx-auto mt-9 max-w-xl">
          <WaitlistForm source="hero" />
          <p className="mt-3.5 text-[13px] text-ink-3">
            Free during beta · 10 visual explanations included · No card needed
          </p>
        </div>
      </div>

      {/* ---------------- Real product shot ---------------- */}
      <div className="relative mx-auto mt-14 max-w-5xl sm:mt-16">
        <div
          aria-hidden="true"
          className="absolute -inset-x-8 -top-10 bottom-10 -z-10 rounded-[48px] opacity-70 blur-2xl"
          style={{
            backgroundImage:
              "radial-gradient(50% 60% at 25% 20%, rgba(240,164,40,.35), transparent 70%), radial-gradient(55% 65% at 80% 70%, rgba(108,76,241,.35), transparent 70%)",
          }}
        />

        <figure className="shadow-frame relative overflow-hidden rounded-[20px] bg-white p-1.5 ring-1 ring-line-strong/60 sm:rounded-[26px] sm:p-2.5">
          <Image
            src="/shots/hero-blackhole.webp"
            alt="Tubelight visual learning platform: A document about black holes on the left half of a Windows desktop, with the Tubelight UI panel open on the right showing a drawn vector diagram of the Anatomy of a Black Hole and synchronized audio player narration."
            width={2590}
            height={1632}
            priority
            quality={95}
            sizes="(max-width: 1280px) 100vw, 1200px"
            className="w-full rounded-[14px] sm:rounded-[18px] shadow-sm"
          />
        </figure>

        <figcaption className="mt-5 text-center text-[13px] text-ink-3">
          Real visual learning output. Highlighted text in any Windows app → an interactive UI diagram and voice narration in the panel beside it.
        </figcaption>
      </div>

      <div className="mx-auto mt-12 flex max-w-4xl flex-wrap items-center justify-center gap-x-2 gap-y-2 text-[13px] text-ink-3">
        <span className="font-medium text-ink-2">Learns with you wherever you read:</span>
        {WORKS_IN.map((app) => (
          <span key={app} className="rounded-full border border-line bg-white/60 px-2.5 py-1">
            {app}
          </span>
        ))}
      </div>
    </section>
  );
}
