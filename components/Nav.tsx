import { Logo } from "./Logo";

const LINKS = [
  { href: "#how", label: "How it works" },
  { href: "#faq", label: "Beta FAQ" },
];

export function Nav() {
  return (
    <header className="relative z-20">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-5">
        <a href="#main" aria-label="Tubelight home" className="shrink-0 flex items-center">
          <Logo />
        </a>

        <nav className="flex items-center gap-1 sm:gap-2">
          <ul className="hidden items-center gap-1 md:flex">
            {LINKS.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className="rounded-lg px-3 py-2 text-sm font-medium text-ink-2 transition-colors hover:bg-paper-2 hover:text-ink"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
          <a
            href="#beta"
            className="rounded-xl bg-ink px-4 py-2.5 text-sm font-semibold text-paper transition-colors hover:bg-violet"
          >
            Request access
          </a>
        </nav>
      </div>
    </header>
  );
}
