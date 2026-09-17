import Link from "next/link";
import type { Metadata } from "next";
import { Logo } from "@/components/Logo";

export const metadata: Metadata = {
  title: "Download Tubelight for Windows",
  description:
    "Download the latest Tubelight desktop app for Windows. Select any text, press Alt+E, and see and hear it explained.",
  alternates: { canonical: "/download" },
  openGraph: {
    title: "Download Tubelight for Windows",
    description: "The latest Tubelight desktop build for Windows 10 and 11.",
    url: "/download",
  },
};

/* The desktop app has always pointed people here — the "Download from tubelight.net"
   button in Settings, the message a Store install gets when it finds a new version it
   cannot overwrite itself, and the fallback shown when an update check fails. The page
   did not exist, so all three led to a 404.
 *
 * Everything on it is read from the same latest.yml the app reads, rather than written
 * down here. A hardcoded version is a version that goes stale on the next release and
 * a file name that goes stale is a download button that 404s — which is exactly the
 * failure this page was built to stop. */

const UPDATES_BASE = process.env.UPDATES_BASE ?? "https://tubelight.net/updates";

type Release = {
  version: string;
  file: string;
  url: string;
  sizeMb: string | null;
  releasedOn: string | null;
};

async function latestRelease(): Promise<Release | null> {
  try {
    // Re-read every 10 minutes: a release lands rarely, and a stale version number on
    // this page is worse than a slightly slow one.
    const res = await fetch(`${UPDATES_BASE}/latest.yml`, { next: { revalidate: 600 } });
    if (!res.ok) return null;
    const text = await res.text();

    const top = (key: string) => {
      const m = new RegExp(`^${key}:\\s*(.+)$`, "m").exec(text);
      return m ? m[1].trim().replace(/^['"]|['"]$/g, "") : null;
    };

    const version = top("version");
    const file = top("path");
    if (!version || !file) return null;

    // The size lives on the files entry, which is indented under `files:`.
    const sizeMatch = /^\s+size:\s*(\d+)\s*$/m.exec(text);
    const sizeMb = sizeMatch ? (Number(sizeMatch[1]) / 1048576).toFixed(0) : null;

    const date = top("releaseDate");
    const releasedOn = date
      ? new Date(date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
      : null;

    return {
      version,
      file,
      // The installer's name contains spaces, so it is encoded rather than interpolated raw.
      url: `${UPDATES_BASE}/${encodeURIComponent(file)}`,
      sizeMb,
      releasedOn,
    };
  } catch {
    return null;
  }
}

export default async function DownloadPage() {
  const release = await latestRelease();

  return (
    <main className="min-h-screen bg-paper text-ink">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-7">
        <Link href="/" aria-label="Tubelight home">
          <Logo />
        </Link>
        <Link
          href="/upgrade"
          className="text-sm font-semibold text-ink-2 transition-colors hover:text-violet"
        >
          Plans
        </Link>
      </header>

      <section className="mx-auto max-w-3xl px-6 pb-24 pt-8 sm:pt-16">
        <h1 className="font-display text-4xl leading-tight tracking-tight sm:text-5xl">
          Download Tubelight
        </h1>
        <p className="mt-4 max-w-xl text-lg text-ink-2">
          Select any text anywhere on Windows, press <Kbd>Alt</Kbd> + <Kbd>E</Kbd>, and see and hear
          it explained.
        </p>

        <div className="mt-10 rounded-2xl border border-line bg-paper-2 p-6 shadow-lift sm:p-8">
          {release ? (
            <>
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className="font-display text-2xl">Windows 10 & 11</span>
                <span className="rounded-full bg-violet-soft px-2.5 py-1 text-xs font-semibold text-violet">
                  v{release.version}
                </span>
              </div>

              <a
                href={release.url}
                className="mt-6 inline-flex items-center justify-center rounded-xl bg-violet px-7 py-3.5 text-base font-semibold text-white transition-colors hover:bg-violet-2"
              >
                Download for Windows
              </a>

              <p className="mt-3 text-sm text-ink-3">
                {release.sizeMb ? `${release.sizeMb} MB installer` : "Windows installer"}
                {release.releasedOn ? ` · Released ${release.releasedOn}` : ""}
              </p>
            </>
          ) : (
            /* The manifest could not be read. Saying so is better than showing a button
               that leads nowhere, which is the failure this page exists to fix. */
            <>
              <div className="font-display text-2xl">Downloads are briefly unavailable</div>
              <p className="mt-3 text-ink-2">
                We could not reach the release server just now. Please try again in a few minutes —
                or email{" "}
                <a className="font-semibold text-violet underline" href="mailto:contact@tubelight.net">
                  contact@tubelight.net
                </a>{" "}
                and we will send you the installer directly.
              </p>
            </>
          )}
        </div>

        <div className="mt-12 grid gap-8 sm:grid-cols-2">
          <div>
            <h2 className="font-display text-xl">Installing</h2>
            <ol className="mt-3 space-y-2 text-ink-2">
              <li>1. Run the installer you just downloaded.</li>
              <li>
                2. Windows may show a &ldquo;Windows protected your PC&rdquo; notice. Choose{" "}
                <span className="font-semibold text-ink">More info</span> and then{" "}
                <span className="font-semibold text-ink">Run anyway</span>.
              </li>
              <li>3. Tubelight starts and sits in your system tray.</li>
              <li>
                4. Select text anywhere and press <Kbd>Alt</Kbd> + <Kbd>E</Kbd>.
              </li>
            </ol>
          </div>

          <div>
            <h2 className="font-display text-xl">Already have it?</h2>
            <p className="mt-3 text-ink-2">
              Tubelight checks for new versions by itself and offers to update in the app. You can
              also open <span className="font-semibold text-ink">Settings → Software Updates</span>{" "}
              and check whenever you like.
            </p>
            <p className="mt-3 text-ink-2">
              If you installed Tubelight from the Microsoft Store, Windows does not allow the app to
              replace itself — download the installer above and run it to move onto the latest
              version.
            </p>
          </div>
        </div>

        <p className="mt-12 text-sm text-ink-3">
          Windows 10 or 11, 64-bit. Tubelight is not yet code-signed, which is why Windows shows the
          notice above on first install.
        </p>
      </section>
    </main>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="rounded-md border border-line-strong bg-paper px-1.5 py-0.5 font-sans text-[0.85em] font-semibold text-ink">
      {children}
    </kbd>
  );
}
