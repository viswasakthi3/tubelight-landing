"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { track } from "@/lib/track";
import { useLightbox, useVideos } from "./Providers";
import { mmss } from "./media";
import { SignupForm } from "./SignupForm";
import { useWaitlist } from "./WaitlistContext";

/* typed = the exact words someone typed into Tubelight to make each video (from the saved library) */
const GALLERY = [
  { slug: "rocket", tag: "Science", bg: "#FFEDE7", fg: "#A63A1E", typed: "how rocket engine works", kw: "rocket rockets engine engines space fuel thrust nozzle launch physics" },
  { slug: "headaches", tag: "Health", bg: "#E3F6EC", fg: "#146B44", typed: "why headaches happen", kw: "headache headaches migraine brain pain head health" },
  { slug: "ocean", tag: "Geography", bg: "#E6F1FF", fg: "#1E5AA8", typed: "Ocean currents", kw: "ocean oceans current currents sea water coriolis climate geography" },
  { slug: "tv", tag: "Tech", bg: "#F1ECFF", fg: "#4B33B8", typed: "how does modern tv worsk so good and high in quality", kw: "tv television screen oled led pixels display picture tech" },
  { slug: "polar-bear", tag: "Nature", bg: "#FFF4D6", fg: "#8A5A00", typed: "life cycle of a polar bear", kw: "polar bear bears arctic animal animals cubs ice nature" },
  { slug: "insurance", tag: "Money", bg: "#FFEDE7", fg: "#A63A1E", typed: "how lic policy works", kw: "insurance lic policy premium money finance life" },
];

const PH = ["why is the sky blue?", "how vaccines train your body", "what is compound interest?", "how rocket engines work", "paste a paragraph from your notes…"];
const STOP: Record<string, number> = { the: 1, how: 1, why: 1, what: 1, does: 1, and: 1, are: 1, for: 1, with: 1, about: 1, work: 1, works: 1, that: 1, this: 1, from: 1, into: 1, your: 1, explain: 1, teach: 1 };

function words(t: string): string[] {
  return String(t || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP[w]);
}

export function Gallery() {
  const videos = useVideos();
  const lb = useLightbox();
  const w = useWaitlist();
  const [q, setQ] = useState("");
  const [ph, setPh] = useState(PH[0]);
  const phTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // The placeholder types each example, holds, moves on (static under reduced motion).
  useEffect(() => {
    let reduce = false;
    try {
      reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    } catch {
      /* ignore */
    }
    if (reduce) return;
    const step = (i: number, n: number) => {
      const full = PH[i % PH.length];
      const next: [number, number, number] = n < full.length ? [i, n + 1, 55] : [i + 1, 0, 1900];
      setPh(full.slice(0, n) || " ");
      phTimer.current = setTimeout(() => step(next[0], next[1]), next[2]);
    };
    step(0, 0);
    return () => clearTimeout(phTimer.current);
  }, []);

  const findMatches = (query: string) => {
    const ws = words(query);
    if (!ws.length) return [];
    return GALLERY.map((g) => {
      const v = videos[g.slug];
      if (!v) return { g, score: 0 };
      const hay = " " + words(v.title + " " + g.typed + " " + g.tag + " " + g.kw).join(" ") + " ";
      let score = 0;
      ws.forEach((x) => {
        if (hay.indexOf(" " + x) >= 0) score++;
      });
      return { g, score };
    })
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score);
  };

  const sq = q.trim();
  const hits = useMemo(() => (sq ? findMatches(sq) : []), [sq, videos]); // eslint-disable-line react-hooks/exhaustive-deps
  const shown = sq && hits.length ? hits.map((x) => x.g) : GALLERY;

  const smeta = !sq
    ? "Or press play on one Tubelight already made:"
    : hits.length
      ? hits.length + (hits.length === 1 ? " explanation matches" : " explanations match") + " “" + sq + "”"
      : w.missTopic
        ? "Meanwhile, here are ones Tubelight already made:"
        : "Nothing here matches “" + sq + "” yet — press Explain it.";

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const t = q.trim();
    if (!t) return;
    const m = findMatches(t);
    track("topic_search", { matched: m.length > 0, results: m.length });
    if (m.length) {
      w.setMissTopic("");
      lb.open(m[0].g.slug);
    } else {
      w.setMissTopic(t.slice(0, 120));
    }
  };

  return (
    <section id="examples" className="sec" style={{ paddingTop: 0, scrollMarginTop: 76 }}>
      <div className="wrapx">
        <div className="head">
          <h2 className="h2">Curious about anything?</h2>
          <p className="lede">Type a topic, or press play on one Tubelight already made. Every one below is real — pictures, voice and all.</p>
        </div>
        <form className="search" role="search" onSubmit={onSearch}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
          <label htmlFor="topic-q" className="sr">What do you want to understand?</label>
          <input
            id="topic-q"
            className="search-in"
            type="search"
            autoComplete="off"
            placeholder={ph}
            value={q}
            onChange={(e) => {
              setQ(e.target.value.slice(0, 200));
              w.setMissTopic("");
            }}
          />
          <button type="submit" className="btn">Explain it</button>
        </form>
        {w.missTopic ? (
          <div className="miss fade" role="status">
            <p className="disp" style={{ margin: 0, fontSize: 22, lineHeight: 1.25, fontWeight: 600, letterSpacing: "-0.02em" }}>
              Tubelight hasn’t explained “{w.missTopic}” on this page yet.
            </p>
            <p style={{ margin: 0, color: "#57536E" }}>In the app it makes one in about 10–30 seconds. Join the waitlist and it can be the first thing you try.</p>
            {!w.sent ? (
              <>
                <SignupForm id="em-miss" placement="miss" label="Join the waitlist" />
                <p className="micro">We’ll email you when your invite is ready. Nothing else.</p>
              </>
            ) : (
              <p style={{ margin: 0, fontWeight: 600, color: "#146B44" }}>You’re on the waitlist — we saved “{w.missTopic}” with your spot.</p>
            )}
          </div>
        ) : null}
        <p className="smeta" aria-live="polite">{smeta}</p>
        <div className="gal">
          {shown.map((g) => {
            const v = videos[g.slug];
            if (!v) return null;
            return (
              <button
                key={g.slug}
                type="button"
                className="gcard"
                onClick={() => lb.open(g.slug)}
                aria-label={`Play: ${v.title}, ${mmss(v.duration)}. Made from the typed topic: ${g.typed}`}
              >
                <span className="gpic">
                  <img src={v.thumb} alt="" loading="lazy" />
                  <span className="gplay" aria-hidden="true">
                    <i><svg viewBox="0 0 24 24"><path d="M7 4.5v15l12.5-7.5z" /></svg></i>
                    {mmss(v.duration)}
                  </span>
                </span>
                <span className="gtag" style={{ background: g.bg, color: g.fg }}>{g.tag}</span>
                <span className="gtitle">{v.title}</span>
                <span className="typed">You typed: <q>{g.typed}</q></span>
              </button>
            );
          })}
        </div>
        <p style={{ margin: "34px 0 0", fontSize: 15, color: "#6F6B86" }}>Unedited output from the Windows app. It’s AI, so it can slip now and then — if something looks off, ask a follow-up.</p>
      </div>
    </section>
  );
}
