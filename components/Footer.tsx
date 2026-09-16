import { Logo } from "./Logo";

export function Footer() {
  return (
    <footer className="relative border-t border-line bg-paper-2/60" aria-label="Site Footer">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-10 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Logo />
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-ink-2">
            The visual learning platform for Windows — turning complex reading into instant UI diagrams and voice walkthroughs.
          </p>
        </div>

        <nav aria-label="Footer links" className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-ink-2">
          <a className="transition-colors hover:text-ink" href="#how">
            How it works
          </a>
          <a className="transition-colors hover:text-ink" href="#features">
            Features
          </a>
          <a className="transition-colors hover:text-ink" href="#faq">
            FAQ
          </a>
          <a className="transition-colors hover:text-ink" href="/upgrade">
            Pro Pricing
          </a>
          <a className="font-semibold text-ink transition-colors hover:text-violet" href="#beta">
            Request access
          </a>
        </nav>
      </div>

      <div className="border-t border-line/70">
        <div className="mx-auto flex max-w-6xl flex-col sm:flex-row items-center justify-between gap-3 px-6 py-5 text-xs text-ink-3">
          <p>© {new Date().getFullYear()} Tubelight · Visual Learning Platform · Windows 10 &amp; 11</p>
          <div className="flex items-center gap-4">
            <a href="/llms.txt" className="hover:text-ink transition-colors" title="LLM and AI Crawler Documentation">
              llms.txt
            </a>
            <a href="/sitemap.xml" className="hover:text-ink transition-colors" title="XML Sitemap">
              Sitemap
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
