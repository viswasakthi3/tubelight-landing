import { Reveal } from "./Reveal";

const FAQ = [
  {
    q: "What does “private beta” actually mean?",
    a: "The app is finished enough to use every day, but we are letting people in gradually so we can watch how it holds up and fix things quickly. Invites go out in weekly batches, newest questions first. You'll get a download link by email — there is no public download yet.",
  },
  {
    q: "Does it cost anything?",
    a: "We offer 10 videos to try at the start to understand about the product.",
  },
  {
    q: "Is the text I highlight sent anywhere?",
    a: "Your selection is sent to the backend to generate the explanation, and it is never logged or stored there. The finished explanations — pictures and audio — are saved locally on your machine, along with your name and notes if you add them. What's kept on the server is the anonymous device ID and how many explanations it used.",
  },
  {
    q: "Windows only? What about Mac?",
    a: "Windows 10 and 11 today — the global Alt + E shortcut and the window-snapping are built on Windows APIs. A Mac build is on the list, and joining the waitlist with a Mac is a useful vote for it.",
  },
  {
    q: "What happens after I request access?",
    a: "You'll get one email confirming you're on the list, then one more when your invite is ready, with the installer and a short getting-started note. No newsletter, no drip campaign — you can unsubscribe from the footer of either email.",
  },
];

export function Faq() {
  return (
    <section id="faq" className="relative mx-auto max-w-3xl px-6 py-20 md:py-24">
      <Reveal>
        <h2 className="display text-center text-[2rem] text-ink sm:text-[2.5rem]">
          Before you hand over your email
        </h2>
      </Reveal>

      <div className="mt-10 divide-y divide-line border-y border-line">
        {FAQ.map((item, i) => (
          <Reveal key={item.q} delay={i * 0.04}>
            <details className="group">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5 text-left text-[1.05rem] font-semibold text-ink transition-colors hover:text-violet">
                {item.q}
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
