import { Reveal } from "./Reveal";

export interface FaqItem {
  q: string;
  a: string;
}

export const FAQS: FaqItem[] = [
  {
    q: "What is Tubelight and how does it speed up learning?",
    a: "Tubelight is a visual learning platform built for Windows. Instead of summarizing text with more text, Tubelight applies Dual-Coding Theory: pressing Alt + E instantly generates an interactive UI diagram and synchronized voice walkthrough right beside what you are reading. Visualizing concepts as flows, anatomies, cycles, and systems helps people understand and retain complex topics up to 3x faster.",
  },
  {
    q: "How does the Alt + E shortcut work across Windows apps?",
    a: "Highlight any confusing passage in any application—Google Chrome, Edge, Adobe Acrobat, Word, Slack, Notion, or VS Code—and press Alt + E. Your active window docks left while Tubelight slides in on the right, rendering a progressive vector diagram with synchronized voice narration in under 3 seconds.",
  },
  {
    q: "What types of topics can Tubelight explain?",
    a: "Tubelight is designed for deep learning across disciplines: science, engineering, biology, economics, programming, medicine, and mathematics. Whether you are deciphering a dense research paper, academic textbook, or codebase, Tubelight draws the underlying mechanisms, flows, and relationships.",
  },
  {
    q: "Can I adjust or steer the visual explanation if it doesn't click?",
    a: "Yes. You can dynamically steer any diagram with a single click—requesting it 'Simpler', 'As a timeline', or 'With a real-world analogy'. You can also ask follow-up questions in the side drawer to explore deeper concepts.",
  },
  {
    q: "What does “private beta” actually mean?",
    a: "The app is finished enough to use every day, but we are letting people in gradually so we can watch how it holds up and fix things quickly. Invites go out in weekly batches. You'll receive a direct download link by email.",
  },
  {
    q: "Does it cost anything?",
    a: "We offer 10 full visual explanations (with animated vector diagrams and voice narration) completely free at the start. Pro and lifetime upgrade plans are available for high-volume learners.",
  },
  {
    q: "Is the text I highlight private and secure?",
    a: "Yes. Your selected text is processed in memory to synthesize the diagram and narration, and it is never logged or stored on our servers. Your completed explanations, audio, and visual history remain private on your local machine.",
  },
  {
    q: "Windows only? What about Mac?",
    a: "Tubelight is built natively for Windows 10 and 11 to support global hotkeys and window-snapping. A macOS version is on our active roadmap, and joining the waitlist with Mac selected helps us gauge demand.",
  },
  {
    q: "What happens after I request access?",
    a: "You'll receive an instant email confirming you are on the list, followed by an invitation with the Windows installer and onboarding guide when your batch is ready. No marketing spam.",
  },
];

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
