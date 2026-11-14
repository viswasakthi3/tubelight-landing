/* The hero demo: a browser full of tabs (the same question searched again and again), and the
 * Quick Search card answering in the corner.
 * It plays on its own (ask → listening → answer), and the visitor can drive it:
 * press and hold the keycaps, or hold Tab + Q on the keyboard, then let go.
 * Plain DOM so the same file also runs in the static design artifact.
 * Every answer is rendered in the markup; this only switches which one shows (data-pic). */

export type DemoSource = { name: string; letter: string; color: string };
export type DemoResult = { url: string; title: string };
export type DemoQuestion = {
  id: "egg" | "tokyo" | "moon";
  pick: string;
  said: string;
  addr: string;
  /** what the crowded tab strip says: the same question, searched again and again */
  tabs: string[];
  /** a page of results that don't agree */
  results: DemoResult[];
  big: string;
  sub: string;
  pic?: string;
  count: string;
  sources: DemoSource[];
};

export const DEMO_QUESTIONS: DemoQuestion[] = [
  {
    id: "egg",
    pick: "Boil an egg",
    said: "How long do I boil an egg?",
    addr: "how long do i boil an egg",
    tabs: ["how long do i boil an egg", "boiled egg time", "how long boil egg soft", "egg boiling minutes", "jammy egg how long", "hard boiled egg time"],
    results: [
      { url: "recipes.example.com", title: "Boil eggs for 12 minutes. Always." },
      { url: "foodblog.example.net", title: "My grandmother’s egg story (part 1 of 4)" },
      { url: "reddit.com › r/Cooking", title: "6 or 10 minutes?? Every site says something else" },
      { url: "kitchen.example.org", title: "How long to boil an egg? It depends" },
    ],
    big: "6 min runny, 7 jammy, 10 hard.",
    sub: "Then straight into ice water.",
    count: "1 / 6",
    sources: [
      { name: "bbcgoodfood.com", letter: "B", color: "#e4572e" },
      { name: "seriouseats.com", letter: "S", color: "#d6232f" },
    ],
  },
  {
    id: "tokyo",
    pick: "Tokyo in April",
    said: "Is April a good time to visit Tokyo?",
    addr: "is april a good time to visit tokyo",
    tabs: ["is april a good time to visit tokyo", "tokyo april weather", "tokyo cherry blossom when", "tokyo in april crowds", "best month for japan", "tokyo spring hotels"],
    results: [
      { url: "travel.example.com", title: "Never visit Japan in April!" },
      { url: "reddit.com › r/JapanTravel", title: "April or November? Please help" },
      { url: "wander.example.net", title: "47 things nobody tells you before Japan" },
      { url: "blog.example.org", title: "The best month for Tokyo (it’s not what you think)" },
    ],
    big: "Yes. It’s cherry blossom season.",
    sub: "Mild days, about 15–19 °C. Book hotels early.",
    pic: "/search/pic-blossom.webp",
    count: "1 / 8",
    sources: [
      { name: "jnto.go.jp", letter: "J", color: "#c0392b" },
      { name: "timeout.com", letter: "T", color: "#d6232f" },
    ],
  },
  {
    id: "moon",
    pick: "The Moon",
    said: "How far away is the Moon?",
    addr: "how far away is the moon",
    tabs: ["how far away is the moon", "moon distance km", "distance earth to moon", "how far is the moon in miles", "moon distance change", "drive to the moon how long"],
    results: [
      { url: "facts.example.com", title: "You won’t BELIEVE these 30 Moon facts" },
      { url: "reddit.com › r/space", title: "Why does the Moon’s distance keep changing?" },
      { url: "science.example.org", title: "Moon distance chart (printable)" },
      { url: "quiz.example.net", title: "Quiz: how far is the Moon?" },
    ],
    big: "About 384,400 km away.",
    sub: "Light gets there in 1.3 seconds.",
    pic: "/search/pic-moon.webp",
    count: "1 / 10",
    sources: [
      { name: "nasa.gov", letter: "N", color: "#1f4fbf" },
      { name: "rmg.co.uk", letter: "R", color: "#22356b" },
    ],
  },
];

type State = "idle" | "listen" | "answer";

export function mountDemo(root: HTMLElement, onTry?: (how: string) => void): () => void {
  const $ = <T extends HTMLElement>(sel: string) => root.querySelector(sel) as T | null;
  const said = $("[data-said]");
  const addr = $("[data-addr]");
  const tabTitles = Array.from(root.querySelectorAll<HTMLElement>("[data-tab]"));
  const resUrls = Array.from(root.querySelectorAll<HTMLElement>("[data-res-url]"));
  const resTitles = Array.from(root.querySelectorAll<HTMLElement>("[data-res-title]"));
  const keys = $("[data-keys]");
  const hint = $("[data-hint]");
  const picks = Array.from(root.querySelectorAll<HTMLButtonElement>("[data-pick]"));
  const N = DEMO_QUESTIONS.length;

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const touch = window.matchMedia("(hover: none)").matches;
  if (hint) hint.textContent = touch ? "Press and hold the keys, then let go." : "Hold Tab + Q on your keyboard, or press the keys.";

  let index = 0;
  let timers: number[] = [];
  let typing = 0;
  let holding: "" | "pointer" | "keys" = "";
  let manualUntil = 0;
  let inView = true;
  let tabDown = false;

  const later = (fn: () => void, ms: number) => { timers.push(window.setTimeout(fn, ms)); };
  const clear = () => { timers.forEach((t) => window.clearTimeout(t)); timers = []; window.clearInterval(typing); };
  const setState = (s: State) => { root.dataset.state = s; };

  function fill(i: number) {
    const d = DEMO_QUESTIONS[i];
    root.dataset.pic = d.id;
    if (addr) addr.textContent = d.addr;
    tabTitles.forEach((el, k) => { el.textContent = d.tabs[k % d.tabs.length]; });
    resUrls.forEach((el, k) => { el.textContent = d.results[k % d.results.length].url; });
    resTitles.forEach((el, k) => { el.textContent = d.results[k % d.results.length].title; });
    picks.forEach((p, k) => p.setAttribute("aria-pressed", String(k === i)));
  }

  function typeWords(i: number, ms: number, done?: () => void) {
    window.clearInterval(typing);
    const words = DEMO_QUESTIONS[i].said.split(" ");
    let n = 0;
    const paint = () => {
      if (!said) return;
      said.textContent = words.slice(0, n).join(" ");
      const caret = document.createElement("span");
      caret.className = "caret";
      said.appendChild(caret);
    };
    paint();
    typing = window.setInterval(() => {
      n += 1;
      paint();
      if (n >= words.length) { window.clearInterval(typing); done?.(); }
    }, Math.max(90, ms / words.length));
  }

  function answer() {
    window.clearInterval(typing);
    if (said) said.textContent = DEMO_QUESTIONS[index].said;
    setState("answer");
  }

  /* one round of the self-playing loop */
  function autoRound() {
    clear();
    if (reduce || !inView || holding || Date.now() < manualUntil) { later(autoRound, 1500); return; }
    later(() => {
      setState("idle");
      later(() => {
        index = (index + 1) % N;
        fill(index);
        setState("listen");
        typeWords(index, 1500, () => later(() => { answer(); autoRound(); }, 450));
      }, 650);
    }, 5200);
  }

  function press(how: "pointer" | "keys") {
    if (holding) return;
    clear();
    holding = how;
    manualUntil = Date.now() + 15000;
    index = (index + 1) % N; // every hold asks a new question
    fill(index);
    setState("listen");
    typeWords(index, 1400);
    onTry?.(how);
  }

  function release() {
    if (!holding) return;
    holding = "";
    manualUntil = Date.now() + 15000;
    answer();
    autoRound();
  }

  function pick(i: number) {
    clear();
    holding = "";
    manualUntil = Date.now() + 15000;
    index = i;
    fill(i);
    setState("listen");
    typeWords(i, 1100, () => later(() => { answer(); autoRound(); }, 350));
    onTry?.("pick");
  }

  const onDown = (e: PointerEvent) => { e.preventDefault(); keys?.setPointerCapture?.(e.pointerId); press("pointer"); };
  const onUp = () => { if (holding === "pointer") release(); };
  // keyboard activation of the button (Enter/Space) has no hold: play a full round
  const onKeyClick = (e: MouseEvent) => { if (e.detail === 0) pick((index + 1) % N); };
  const noMenu = (e: Event) => e.preventDefault();
  const isEditable = (t: EventTarget | null) =>
    t instanceof HTMLElement && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName));
  const onKeyDown = (e: KeyboardEvent) => {
    if (!inView || e.altKey || e.ctrlKey || e.metaKey) return;
    if (e.key === "Tab" && !e.shiftKey) {
      if (e.repeat && tabDown) e.preventDefault(); // holding Tab must not run focus down the page
      tabDown = true;
      return;
    }
    if ((e.key === "q" || e.key === "Q") && tabDown && !isEditable(e.target)) {
      e.preventDefault();
      if (!e.repeat) press("keys");
    }
  };
  const onKeyUp = (e: KeyboardEvent) => {
    if (e.key === "Tab") tabDown = false;
    if ((e.key === "Tab" || e.key === "q" || e.key === "Q") && holding === "keys") release();
  };
  const onBlur = () => { tabDown = false; if (holding) release(); };
  const pickers = picks.map((p, k) => { const fn = () => pick(k); p.addEventListener("click", fn); return fn; });

  keys?.addEventListener("pointerdown", onDown);
  keys?.addEventListener("pointerup", onUp);
  keys?.addEventListener("pointercancel", onUp);
  keys?.addEventListener("lostpointercapture", onUp);
  keys?.addEventListener("click", onKeyClick);
  keys?.addEventListener("contextmenu", noMenu);
  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);
  window.addEventListener("blur", onBlur);

  let io: IntersectionObserver | null = null;
  if ("IntersectionObserver" in window) {
    io = new IntersectionObserver((entries) => { inView = entries[0]?.isIntersecting ?? true; }, { threshold: 0.25 });
    io.observe(root);
  }

  fill(index);
  setState("answer");
  autoRound();

  return () => {
    clear();
    io?.disconnect();
    picks.forEach((p, k) => p.removeEventListener("click", pickers[k]));
    keys?.removeEventListener("pointerdown", onDown);
    keys?.removeEventListener("pointerup", onUp);
    keys?.removeEventListener("pointercancel", onUp);
    keys?.removeEventListener("lostpointercapture", onUp);
    keys?.removeEventListener("click", onKeyClick);
    keys?.removeEventListener("contextmenu", noMenu);
    window.removeEventListener("keydown", onKeyDown);
    window.removeEventListener("keyup", onKeyUp);
    window.removeEventListener("blur", onBlur);
  };
}
