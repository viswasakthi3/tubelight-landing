/* Page-level behaviour for the Quick Search landing, in plain DOM so the design artifact runs it too.
 * 1. "Watch it work" scrolls the film to the middle of the screen and starts it.
 * 2. A slim bar with the download button slides in once the hero button has scrolled away,
 *    and steps aside while the closing panel (which has its own button) is on screen. */

export function mountPage(root: HTMLElement): () => void {
  const offs: (() => void)[] = [];

  const film = root.querySelector<HTMLElement>("#film");
  root.querySelectorAll<HTMLAnchorElement>("[data-film-link]").forEach((a) => {
    const go = (e: MouseEvent) => {
      if (!film) return;
      e.preventDefault();
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      film.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" });
      // pressing play inside this click keeps the visitor's gesture, so the film may start with sound
      film.querySelector<HTMLButtonElement>(".play")?.click();
      try { history.replaceState(null, "", "#film"); } catch { /* fine */ }
    };
    a.addEventListener("click", go);
    offs.push(() => a.removeEventListener("click", go));
  });

  const bar = root.querySelector<HTMLElement>("[data-sticky]");
  const heroCta = root.querySelector<HTMLElement>("[data-hero-cta]");
  const finalCta = root.querySelector<HTMLElement>("#get");
  if (bar && heroCta && "IntersectionObserver" in window) {
    let heroGone = false;
    let finalOn = false;
    const paint = () => {
      const show = heroGone && !finalOn;
      bar.dataset.show = String(show);
      if (show) bar.removeAttribute("inert"); else bar.setAttribute("inert", "");
    };
    const io1 = new IntersectionObserver(([e]) => {
      // gone = scrolled past it (above the top), not merely below the fold
      heroGone = !e.isIntersecting && e.boundingClientRect.top < 0;
      paint();
    });
    io1.observe(heroCta);
    let io2: IntersectionObserver | null = null;
    if (finalCta) {
      io2 = new IntersectionObserver(([e]) => { finalOn = e.isIntersecting; paint(); }, { threshold: 0.2 });
      io2.observe(finalCta);
    }
    offs.push(() => { io1.disconnect(); io2?.disconnect(); });
  }

  return () => offs.forEach((f) => f());
}
