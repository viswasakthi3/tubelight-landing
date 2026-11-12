/** Only one video plays at a time: each player registers a pause function here. */
const pausers = new Map<string, () => void>();

export function registerPauser(id: string, fn: () => void): () => void {
  pausers.set(id, fn);
  return () => {
    if (pausers.get(id) === fn) pausers.delete(id);
  };
}

export function pauseOthers(except: string): void {
  pausers.forEach((fn, id) => {
    if (id !== except) {
      try {
        fn();
      } catch {
        /* ignore */
      }
    }
  });
}

export function mmss(s: number | undefined): string {
  const n = Math.max(0, Math.floor(s || 0));
  const m = Math.floor(n / 60);
  const r = n % 60;
  return `${m}:${r < 10 ? "0" : ""}${r}`;
}

export function cueAt(cues: { start: number; end: number; text: string }[] | undefined, t: number): string {
  if (!cues) return "";
  for (const c of cues) if (t >= c.start && t < c.end) return c.text;
  return "";
}

export function fmt(n: number): string {
  try {
    return Number(n).toLocaleString("en-IN");
  } catch {
    return String(n);
  }
}

/** Keeps Tab focus inside a dialog. */
export function trapTab(e: React.KeyboardEvent<HTMLElement>): void {
  if (e.key !== "Tab") return;
  const root = e.currentTarget;
  const nodes = Array.from(
    root.querySelectorAll<HTMLElement>('a[href],button:not([disabled]),input,textarea,select,video[controls],[tabindex]:not([tabindex="-1"])'),
  ).filter((n) => n.offsetParent !== null || n === document.activeElement);
  if (!nodes.length) return;
  const first = nodes[0];
  const last = nodes[nodes.length - 1];
  const active = document.activeElement;
  if (e.shiftKey && (active === first || active === root)) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && active === last) {
    e.preventDefault();
    first.focus();
  }
}
