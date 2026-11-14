"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { track } from "@/lib/track";
import { findMatches, matchedVideo } from "./catalog";
import { mmss } from "./media";
import { usePlayer, useVideos } from "./Providers";

const PH = ["how memory works", "why is the sky blue?", "how vaccines train your body", "what is compound interest?"];
const PH_LEAD = "Search a topic or paste text…  e.g. ";

const IC_SEARCH = "M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-3.5-3.5";
const IC_PLAY = "M8 5.5v13l10.5-6.5z";
const IC_SPARK = "M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9zM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z";

/* shown when Wikipedia cannot be reached */
const SEEDS: [string, string][] = [
  ["Black hole", "Region of spacetime where nothing, not even light, escapes"],
  ["Blood pressure", "Pressure of circulating blood on the walls of arteries"],
  ["Blood sugar", "How much glucose is in your blood"],
  ["Photosynthesis", "How plants turn light into chemical energy"],
  ["Compound interest", "Interest earned on interest"],
  ["Vaccine", "A preparation that trains the immune system"],
  ["Immune system", "The body’s network of defences"],
  ["Insulin", "Hormone that lets cells take in sugar"],
  ["Inflation", "A general rise in prices over time"],
  ["Quantum entanglement", "Particles that share one state at a distance"],
  ["Machine learning", "Computers learning patterns from data"],
  ["Heart", "The muscle that pumps blood through the body"],
  ["Heart attack", "Blocked blood flow to the heart muscle"],
  ["Memory", "How the brain stores and recalls information"],
  ["Sky", "Why is the sky blue? Rayleigh scattering"],
  ["Volcano", "Where molten rock reaches the surface"],
  ["Stock market", "Where shares of companies are bought and sold"],
  ["Electricity", "The flow of electric charge"],
  ["Gravity", "The pull between masses"],
  ["Sleep", "Why the body and brain need rest"],
];

type Topic = { title: string; topic: string; hint: string };

const cap = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

/** One Wikipedia title result as a suggestion: "(parenthetical)" moves from the title into the hint. */
function fromWiki(page: { title?: unknown; description?: unknown }): Topic | null {
  const full = typeof page.title === "string" ? page.title.trim() : "";
  if (!full) return null;
  const m = /^(.*?)\s*\(([^)]+)\)\s*$/.exec(full);
  const title = m && m[1] ? m[1] : full;
  const paren = m && m[1] ? cap(m[2]) : "";
  const desc = typeof page.description === "string" ? cap(page.description.trim()) : "";
  // People come here to understand things, not to find albums, films or episodes.
  if (MEDIA.test(desc) || MEDIA.test(paren) || /^(list of|disambiguation)/i.test(full) || /disambiguation/i.test(desc)) return null;
  return { title, topic: full, hint: [paren, desc].filter(Boolean).join(" · ") || "Wikipedia article" };
}

const MEDIA =
  /\b(album|single|song|film|movie|band|rapper|singer|musician|episode|tv series|television series|video game|novel|soundtrack|ep by|mixtape|sitcom|comic|manga|anime|footballer|cricketer|actor|actress)\b/i;

const WIKI_DEBOUNCE_MS = 180;
const WIKI_TIMEOUT_MS = 3500;

type Wiki = { q: string; items: Topic[] | "fail" };

/** Real Wikipedia title suggestions for what is typed (debounced, with a timeout). */
function useWikiTitles(query: string): Wiki | null {
  const [wiki, setWiki] = useState<Wiki | null>(null);
  const cache = useRef(new Map<string, Topic[]>());
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) return;
    const hit = cache.current.get(q.toLowerCase());
    if (hit) {
      setWiki({ q, items: hit });
      return;
    }
    const ac = new AbortController();
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      ac.abort();
    }, WIKI_DEBOUNCE_MS + WIKI_TIMEOUT_MS);
    const start = setTimeout(async () => {
      try {
        const res = await fetch(`https://en.wikipedia.org/w/rest.php/v1/search/title?q=${encodeURIComponent(q)}&limit=10`, {
          signal: ac.signal,
          headers: { accept: "application/json" },
        });
        if (!res.ok) throw new Error("wikipedia " + res.status);
        const body = (await res.json()) as { pages?: { title?: unknown; description?: unknown }[] };
        const items = (Array.isArray(body.pages) ? body.pages : []).map(fromWiki).filter((x): x is Topic => !!x);
        cache.current.set(q.toLowerCase(), items);
        setWiki({ q, items });
      } catch {
        if (!ac.signal.aborted || timedOut) setWiki({ q, items: "fail" });
      } finally {
        clearTimeout(timer);
      }
    }, WIKI_DEBOUNCE_MS);
    return () => {
      clearTimeout(start);
      clearTimeout(timer);
      ac.abort();
    };
  }, [query]);
  return wiki;
}

type Item = {
  kind: "watch" | "topic" | "make";
  slug?: string;
  /** what the video is made about (a Wikipedia topic keeps its "(parenthetical)") */
  topic?: string;
  title: string;
  pre: string;
  mid: string;
  post: string;
  hint: string;
  badge: string;
  icon: string;
};

export function TopicSearch() {
  const videos = useVideos();
  const player = usePlayer();
  const [q, setQ] = useState("");
  const [ph, setPh] = useState(PH_LEAD);
  const [open, setOpen] = useState(false);
  const [idx, setIdx] = useState(-1);
  const phTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const blurTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const btn = useRef<HTMLButtonElement | null>(null);
  const wiki = useWikiTitles(q);

  // The placeholder types each example, holds, moves on (static under reduced motion).
  useEffect(() => {
    let reduce = false;
    try {
      reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    } catch {
      /* ignore */
    }
    if (reduce) {
      setPh(PH_LEAD + PH[0]);
      return;
    }
    const step = (i: number, n: number) => {
      const ex = PH[i % PH.length];
      const next: [number, number, number] = n < ex.length ? [i, n + 1, 60] : [i + 1, 0, 2200];
      setPh(PH_LEAD + ex.slice(0, n));
      phTimer.current = setTimeout(() => step(next[0], next[1]), next[2]);
    };
    step(0, 0);
    return () => clearTimeout(phTimer.current);
  }, []);

  useEffect(() => () => clearTimeout(blurTimer.current), []);

  const list = useMemo<Item[]>(() => {
    const text = q.trim();
    const split = (title: string) => {
      const i = text ? title.toLowerCase().indexOf(text.toLowerCase()) : -1;
      return i < 0 ? { pre: title, mid: "", post: "" } : { pre: title.slice(0, i), mid: title.slice(i, i + text.length), post: title.slice(i + text.length) };
    };
    const watch = (slug: string): Item | null => {
      const v = videos[slug];
      if (!v) return null;
      return { kind: "watch", slug, title: v.title, hint: "Ready-made video · " + mmss(v.duration), badge: "Watch", icon: IC_PLAY, ...split(v.title) };
    };
    const out: Item[] = [];
    if (!text) {
      ["rocket", "kidneys", "supernova"].forEach((k) => {
        const it = watch(k);
        if (it) out.push(it);
      });
      return out;
    }
    findMatches(text, videos)
      .slice(0, 2)
      .forEach((m) => {
        const it = watch(m.slug);
        if (it) out.push(it);
      });
    let topics: Topic[] = [];
    if (wiki && wiki.q === text) {
      if (wiki.items === "fail") {
        const ql = text.toLowerCase();
        topics = SEEDS.filter(([t]) => {
          const tl = t.toLowerCase();
          return tl.indexOf(ql) === 0 || (ql.length > 2 && tl.indexOf(ql) >= 0);
        })
          .slice(0, 5)
          .map(([t, hint]) => ({ title: t, topic: t, hint }));
      } else topics = wiki.items.slice(0, 5);
    }
    topics.forEach((t) => out.push({ kind: "topic", topic: t.topic, title: t.title, hint: t.hint, badge: "", icon: IC_SEARCH, ...split(t.title) }));
    if (text.length >= 2) {
      out.push({ kind: "make", title: text, pre: "Make a video about “", mid: "", post: text.slice(0, 80) + "”", hint: "Free preview · about 20 s · email needed to watch", badge: "New", icon: IC_SPARK });
    }
    return out;
  }, [q, videos, wiki]);

  const shown = open && list.length > 0;
  const active = Math.min(idx, list.length - 1);

  const pick = (item: Item) => {
    setOpen(false);
    setIdx(-1);
    track("suggestion_pick", { kind: item.kind });
    if (item.kind === "watch" && item.slug) player.open(item.slug, 0, btn.current);
    else player.live((item.topic ?? item.title).slice(0, 200), btn.current);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const n = list.length;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setIdx(n ? (Math.max(-1, idx) + 1) % n : -1);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setOpen(true);
      setIdx(n ? (idx <= 0 ? n - 1 : idx - 1) : -1);
    } else if (e.key === "Escape") {
      setOpen(false);
      setIdx(-1);
    } else if (e.key === "Tab" && open && idx >= 0 && list[idx] && list[idx].kind === "topic") {
      e.preventDefault();
      setQ((list[idx].topic ?? list[idx].title).slice(0, 200));
      setIdx(-1);
    }
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (open && idx >= 0 && list[idx]) {
      pick(list[idx]);
      return;
    }
    const t = q.trim();
    if (t.length < 2) return;
    const slug = matchedVideo(t, videos);
    const matched = !!slug;
    track("topic_search", { matched });
    setOpen(false);
    if (slug) player.open(slug, 0, btn.current);
    else player.live(t.slice(0, 200), btn.current);
  };

  return (
    <div className="sbox">
      <form className="search" role="search" onSubmit={onSubmit}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d={IC_SEARCH} /></svg>
        <label htmlFor="topic-q" className="sr">What do you want to understand?</label>
        <input
          id="topic-q"
          className="search-in"
          type="text"
          role="combobox"
          aria-expanded={shown}
          aria-controls="topic-sugg"
          aria-autocomplete="list"
          aria-activedescendant={shown && active >= 0 ? "sg-" + active : undefined}
          autoComplete="off"
          placeholder={ph}
          value={q}
          onChange={(e) => {
            setQ(e.target.value.slice(0, 200));
            setOpen(true);
            setIdx(-1);
          }}
          onKeyDown={onKeyDown}
          onFocus={() => {
            clearTimeout(blurTimer.current);
            setOpen(true);
          }}
          onBlur={() => {
            clearTimeout(blurTimer.current);
            blurTimer.current = setTimeout(() => {
              setOpen(false);
              setIdx(-1);
            }, 150);
          }}
        />
        <button type="submit" className="btn go" ref={btn}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d={IC_SEARCH} /></svg>
          Explain it
        </button>
      </form>
      {shown ? (
        <div className="sugg" id="topic-sugg" role="listbox" aria-label="Suggestions">
          {list.map((it, i) => (
            <button
              key={it.kind + i + it.title}
              type="button"
              id={"sg-" + i}
              role="option"
              aria-selected={i === active}
              className={"sg " + it.kind + (i === active ? " on" : "")}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => pick(it)}
            >
              <span className="sg-ic" aria-hidden="true">
                <svg viewBox="0 0 24 24"><path d={it.icon} /></svg>
              </span>
              <span className="sg-t">
                <b>{it.pre}<mark>{it.mid}</mark>{it.post}</b>
                <small>{it.hint}</small>
              </span>
              {it.badge ? <span className="sg-badge">{it.badge}</span> : null}
            </button>
          ))}
          <p className="sugg-foot">Suggestions from Wikipedia. Your video is made fresh for your topic.</p>
        </div>
      ) : null}
    </div>
  );
}
