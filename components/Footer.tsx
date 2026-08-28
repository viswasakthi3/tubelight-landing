import { Logo } from "./Logo";

export function Footer() {
  return (
    <footer className="relative border-t border-line bg-paper-2/60">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-10 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Logo />
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-ink-2">
            Light on the thing you are trying to understand — arriving fast enough to be worth it.
          </p>
        </div>

        <nav className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-ink-2">
          <a className="transition-colors hover:text-ink" href="#how">
            How it works
          </a>
          <a className="transition-colors hover:text-ink" href="#faq">
            Beta FAQ
          </a>
          <a className="font-semibold text-ink transition-colors hover:text-violet" href="#beta">
            Request access
          </a>
        </nav>
      </div>

      <div className="border-t border-line/70">
        <p className="mx-auto max-w-6xl px-6 py-5 text-xs text-ink-3">
          © {new Date().getFullYear()} Tubelight · Windows 10 &amp; 11 · Private beta
        </p>
      </div>
    </footer>
  );
}
