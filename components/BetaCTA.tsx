import { Mark } from "./Logo";
import { Reveal } from "./Reveal";
import { WaitlistForm } from "./WaitlistForm";

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
              Start learning visually today.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg leading-relaxed text-ink-2">
              Join students, researchers, and engineers who use Tubelight to understand complex topics fast on Windows. Includes 10 free visual diagram explanations at signup.
            </p>

            <div className="mx-auto mt-9 max-w-xl text-left">
              <WaitlistForm source="beta-cta" askRole />
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
