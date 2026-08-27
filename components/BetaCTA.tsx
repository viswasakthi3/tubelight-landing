import { Mark } from "./Logo";
import { Reveal } from "./Reveal";
import { WaitlistForm } from "./WaitlistForm";

const INCLUDED = [
  { label: "5 explanations a day", detail: "Free for the whole beta. No card, no trial clock." },
  { label: "Windows 10 & 11", detail: "~120 MB installer, delivered by email when your invite lands." },
  { label: "A say in what ships", detail: "Beta users get a direct line to the team building it." },
];

export function BetaCTA() {
  return (
    <section id="beta" className="relative px-6 pb-24 pt-4">
      <Reveal>
        <div className="relative mx-auto max-w-5xl overflow-hidden rounded-[28px] border border-line-strong/70 bg-[linear-gradient(160deg,#fffdf8_0%,#fbf2e2_55%,#f3ecff_100%)] px-6 py-14 text-center sm:px-12 sm:py-16">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{
              backgroundImage:
                "radial-gradient(40% 45% at 50% 0%, rgba(240,164,40,.30), transparent 68%), radial-gradient(45% 50% at 90% 100%, rgba(108,76,241,.22), transparent 66%)",
            }}
          />

          <div className="relative">
            <Mark className="mx-auto h-14 w-auto filament-glow" />

            <h2 className="display mx-auto mt-6 max-w-2xl text-[2.2rem] text-ink sm:text-[3rem]">
              Put a light on it.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg leading-relaxed text-ink-2">
              Tubelight is open to a small group of beta users while we get it right. Leave your
              email and we&rsquo;ll send an invite in the next batch.
            </p>

            <div className="mx-auto mt-9 max-w-xl text-left">
              <WaitlistForm source="beta-cta" askRole />
            </div>

            <dl className="mx-auto mt-12 grid max-w-3xl gap-6 border-t border-line pt-9 text-left sm:grid-cols-3">
              {INCLUDED.map((item) => (
                <div key={item.label}>
                  <dt className="flex items-center gap-2 text-[0.98rem] font-semibold text-ink">
                    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 shrink-0 text-filament" aria-hidden="true">
                      <path d="M10 1.7 12.4 7l5.8.5-4.4 3.8 1.3 5.7L10 14l-5.1 3 1.3-5.7L1.8 7.5 7.6 7z" />
                    </svg>
                    {item.label}
                  </dt>
                  <dd className="mt-1.5 text-[0.92rem] leading-relaxed text-ink-2">{item.detail}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
