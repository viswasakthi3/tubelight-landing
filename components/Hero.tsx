import Image from "next/image";
import { WaitlistForm } from "./WaitlistForm";

const WORKS_IN = ["Chrome", "Edge", "PDFs", "Word", "Slack", "Notion", "VS Code"];

export function Hero() {
  return (
    <section className="relative px-6 pb-16 pt-6 sm:pt-10">
      <div className="mx-auto max-w-3xl text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-line bg-white/70 px-3.5 py-1.5 text-[13px] font-medium text-ink-2 backdrop-blur-sm">
          <span className="relative flex h-2 w-2" aria-hidden="true">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-filament opacity-70" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-filament" />
          </span>
          Private beta · Windows 10 &amp; 11
        </span>

        <h1 className="display mt-7 text-[2.6rem] leading-[1.04] text-ink sm:text-[3.6rem] md:text-[4.15rem]">
          Confused by something?
          <span className="mt-2 block text-violet">
            Press <kbd className="keycap keycap-inline">Alt</kbd>
            <span className="mx-0.5 align-[0.22em] text-[0.42em] text-ink-3">+</span>
            <kbd className="keycap keycap-inline">E</kbd>
          </span>
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-ink-2 sm:text-xl">
          Tubelight explains whatever you highlight — a picture being drawn and a voice talking you
          through it, right next to what you were already reading.
        </p>

        <div className="mx-auto mt-9 max-w-xl">
          <WaitlistForm source="hero" />
          <p className="mt-3.5 text-[13px] text-ink-3">
            Free during beta · No card · Invites go out weekly
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
            src="/shots/hero-alte.webp"
            alt="A PDF about human memory on the left half of a Windows screen, with the Tubelight panel open on the right showing a labelled brain diagram, four numbered steps and an audio player."
            width={1600}
            height={789}
            priority
            sizes="(max-width: 1024px) 100vw, 1024px"
            className="w-full rounded-[14px] sm:rounded-[18px]"
          />
        </figure>

        <figcaption className="mt-5 text-center text-[13px] text-ink-3">
          Real output. Highlighted text in a PDF → a drawn explanation and narration, in the panel
          beside it.
        </figcaption>
      </div>

      <div className="mx-auto mt-12 flex max-w-4xl flex-wrap items-center justify-center gap-x-2 gap-y-2 text-[13px] text-ink-3">
        <span className="font-medium text-ink-2">Works wherever you read:</span>
        {WORKS_IN.map((app) => (
          <span key={app} className="rounded-full border border-line bg-white/60 px-2.5 py-1">
            {app}
          </span>
        ))}
      </div>
    </section>
  );
}
