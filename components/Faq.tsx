import { Reveal } from "./Reveal";
import { FAQS } from "@/lib/faqs";
import type { FaqItem } from "@/lib/faqs";

export { FAQS };
export type { FaqItem };

export function Faq() {
  return (
    <section id="faq" className="relative mx-auto max-w-3xl px-6 py-20 md:py-24" aria-labelledby="faq-heading">
      <Reveal>
        <div className="text-center">
          <p className="text-sm font-semibold tracking-[0.14em] text-violet uppercase">Frequently Asked Questions</p>
          <h2 id="faq-heading" className="display mt-2 text-[2rem] text-ink sm:text-[2.5rem]">
            Everything you need to know
          </h2>
          <p className="mt-3 text-ink-2 text-base max-w-lg mx-auto">
            How Tubelight uses UI and voice synthesis to help you learn faster on Windows.
          </p>
        </div>
      </Reveal>

      <div className="mt-10 divide-y divide-line border-y border-line">
        {FAQS.map((item, i) => (
          <Reveal key={item.q} delay={i * 0.03}>
            <details className="group">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5 text-left text-[1.05rem] font-semibold text-ink transition-colors hover:text-violet">
                <span>{item.q}</span>
                <span
                  aria-hidden="true"
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-line text-ink-3 transition-transform duration-300 group-open:rotate-45 group-open:border-violet group-open:text-violet"
                >
                  <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
                    <path d="M9.2 3h1.6v6.2H17v1.6h-6.2V17H9.2v-6.2H3V9.2h6.2z" />
                  </svg>
                </span>
              </summary>
              <p className="pb-6 pr-12 text-[0.98rem] leading-relaxed text-ink-2">{item.a}</p>
            </details>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
