"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { track } from "@/lib/track";
import { usePlayer, useVideos } from "./Providers";
import { matchedVideo } from "./catalog";
import { Joined, SignupForm, InviteStatus } from "./SignupForm";
import { cueAt, mmss, pauseOthers, registerPauser } from "./media";
import { Pointer } from "./Pointer";
import { Seek } from "./Seek";
import { useWaitlist } from "./WaitlistContext";

const HERO = [
  { slug: "hero-rocket", label: "Rockets", color: "#FF6F4F", app: "Rockets.pdf", kicker: "Physics · Chapter 4", title: "How rockets fly",
    lead: "A rocket carries everything it needs to burn, because there is no air in space.",
    sel: "Liquid fuel and liquid oxygen are pumped into the combustion chamber, where they burn and rush out through the nozzle.", tail: "The hot gas going down pushes the rocket up.",
    typed: "How a rocket engine works" },
  { slug: "hero-headaches", label: "Headaches", color: "#22B573", app: "Health article", kicker: "How the body works", title: "Where headaches begin",
    lead: "The brain processes pain, but brain tissue itself has no pain sensors.",
    sel: "Why do headaches happen if the brain itself can’t feel pain?", tail: "The answer is in the layers around it.",
    typed: "If the brain can’t feel pain, why do headaches hurt?" },
  { slug: "hero-black-holes", label: "Black holes", color: "#D79A32", app: "Space notes.docx", kicker: "Astronomy", title: "A bright ring around darkness",
    lead: "A feeding black hole can be surrounded by a disk of hot, glowing gas.",
    sel: "Why is there a bright ring around a black hole?", tail: "Follow the gas, then follow its light.",
    typed: "Why is there a bright ring around a black hole?" },
];

type Mode = "idle" | "playing" | "done";
type Way = "select" | "type";

const CHECK = <path d="m5 12 5 5 9-10" />;

export function Hero() {
  const videos = useVideos();
  const w = useWaitlist();
  const player = usePlayer();
  const [topic, setTopic] = useState(0);
  const [mode, setMode] = useState<Mode>("idle");
  const [way, setWay] = useState<Way>("type");
  const [hq, setHq] = useState("");
  const [vt, setVt] = useState(0);
  const [pressed, setPressed] = useState(false);
  const [coarse, setCoarse] = useState(false);
  useEffect(() => {
    setCoarse(window.matchMedia("(pointer: coarse)").matches);
  }, []);
  const [muted, setMuted] = useState(true);
  const [paused, setPaused] = useState(true);

  const hv = useRef<HTMLVideoElement | null>(null);
  const panel = useRef<HTMLDivElement | null>(null);
  const touched = useRef(false);
  const modeRef = useRef<Mode>("idle");
  const timers = useRef<{ a1?: ReturnType<typeof setTimeout>; p1?: ReturnType<typeof setTimeout>; ae?: ReturnType<typeof setTimeout> }>({});
  const wayRef = useRef<Way>("type");
  const hqEl = useRef<HTMLInputElement | null>(null);
  const goBtn = useRef<HTMLButtonElement | null>(null);
  const justFocused = useRef(false);
  const rail = useRef<HTMLDivElement | null>(null);
  const topicRef = useRef(0);
  const reduceRef = useRef(false);
  const tyRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const tnRef = useRef(0);

  const setModeBoth = (m: Mode) => {
    modeRef.current = m;
    setMode(m);
  };

  const go = useCallback((byUser: boolean) => {
    clearTimeout(timers.current.a1);
    clearTimeout(timers.current.p1);
    clearTimeout(timers.current.ae);
    pauseOthers("hero");
    if (byUser) touched.current = true;
    setPressed(true);
    setModeBoth("playing");
    setVt(0);
    if (byUser) setMuted(false);
    timers.current.p1 = setTimeout(() => setPressed(false), 260);
    const el = hv.current;
    if (el) {
      try {
        el.muted = byUser ? false : true;
        el.currentTime = 0;
        const p = el.play();
        if (p && p.catch) {
          p.catch(() => {
            el.muted = true;
            setMuted(true);
            el.play().catch(() => {});
          });
        }
      } catch {
        /* ignore */
      }
    }
    track("hero_video_play", { slug: HERO[topicRef.current].slug, sound: byUser });
    if (byUser && panel.current && typeof window !== "undefined" && window.innerWidth < 720) {
      setTimeout(() => {
        try {
          panel.current?.scrollIntoView({ behavior: "smooth", block: "center" });
        } catch {
          /* ignore */
        }
      }, 350);
    }
  }, []);

  // The sample topic types itself into the box, then Enter is pressed for the visitor.
  const typeTopic = useCallback(
    (idx: number, byUser: boolean) => {
      clearInterval(tyRef.current);
      clearTimeout(timers.current.ae);
      const full = HERO[idx].typed;
      const pressEnter = () => {
        timers.current.ae = setTimeout(() => {
          if (wayRef.current !== "type" || modeRef.current !== "idle") return;
          if (!byUser && touched.current) return;
          go(byUser);
        }, 650);
      };
      if (reduceRef.current) {
        tnRef.current = full.length;
        setHq(full);
        if (byUser) pressEnter();
        return;
      }
      tnRef.current = 0;
      setHq("");
      tyRef.current = setInterval(() => {
        const n = tnRef.current + 1;
        tnRef.current = n;
        setHq(full.slice(0, n));
        if (n >= full.length) {
          clearInterval(tyRef.current);
          pressEnter();
        }
      }, 45);
    },
    [go],
  );

  useEffect(() => {
    const t = timers.current;
    const off = registerPauser("hero", () => hv.current?.pause());
    let reduce = false;
    try {
      reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    } catch {
      /* ignore */
    }
    reduceRef.current = reduce;
    if (reduce) {
      setHq(HERO[0].typed);
    } else {
      // Open on load: wait for left side entrance and underline to finish (1800ms) plus a 1s gap (2800ms total),
      // so visitor attention is not split while the left side is loading.
      t.a1 = setTimeout(() => {
        if (!touched.current && wayRef.current === "type") typeTopic(0, false);
      }, 2800);
    }
    return () => {
      off();
      clearTimeout(t.a1);
      clearTimeout(t.p1);
      clearTimeout(t.ae);
      clearInterval(tyRef.current);
    };
  }, [typeTopic]);

  const switchWay = (m: Way) => {
    if (m === way) return;
    clearTimeout(timers.current.a1);
    clearTimeout(timers.current.ae);
    clearInterval(tyRef.current);
    touched.current = true;
    try {
      hv.current?.pause();
    } catch {
      /* ignore */
    }
    wayRef.current = m;
    setWay(m);
    setModeBoth("idle");
    setVt(0);
    tnRef.current = 0;
    track("mode_switch", { mode: m });
    if (m === "type") typeTopic(topicRef.current, true);
  };

  const pickTopic = (i: number) => {
    clearTimeout(timers.current.a1);
    clearTimeout(timers.current.ae);
    clearInterval(tyRef.current);
    touched.current = true;
    try {
      hv.current?.pause();
    } catch {
      /* ignore */
    }
    topicRef.current = i;
    setTopic(i);
    setModeBoth("idle");
    setVt(0);
    if (way === "type") typeTopic(i, true);
  };

  const ask = way === "type";
  const tp = HERO[topic];
  const v = videos[tp.slug];
  const idle = mode === "idle";
  const done = mode === "done";
  const dur = v?.duration || 0;
  const live = mode === "playing" && !paused;
  let cur = 0;
  const shs = v?.sheets ?? [];
  for (let k = 0; k < shs.length; k++) if (vt + 0.05 >= shs[k].start) cur = k;
  const cues = v?.cues;

  const togglePlay = () => {
    if (idle) {
      go(true);
      return;
    }
    const el = hv.current;
    if (!el) return;
    try {
      if (el.paused) {
        pauseOthers("hero");
        el.play().catch(() => {});
      } else el.pause();
    } catch {
      /* ignore */
    }
  };

  const stopTyping = () => {
    clearTimeout(timers.current.a1);
    clearTimeout(timers.current.ae);
    clearInterval(tyRef.current);
    touched.current = true;
  };

  const submitTopic = (e: React.FormEvent) => {
    e.preventDefault();
    const q = hq.trim();
    if (!q) {
      hqEl.current?.focus();
      return;
    }
    stopTyping();
    const i = HERO.findIndex((x) => x.typed.toLowerCase() === q.toLowerCase());
    if (i >= 0) {
      if (i !== topicRef.current) {
        topicRef.current = i;
        setTopic(i);
        setTimeout(() => go(true), 80);
      } else go(true);
      return;
    }
    const saved = matchedVideo(q, videos);
    if (saved) return player.open(saved, 0, goBtn.current);
    player.live(q.slice(0, 200), goBtn.current);
  };

  // The pill in the player bar: back to the box, text selected, ready to be replaced.
  const editTopic = () => {
    stopTyping();
    try {
      hv.current?.pause();
    } catch {
      /* ignore */
    }
    setModeBoth("idle");
    setVt(0);
    setTimeout(() => {
      try {
        hqEl.current?.focus();
        hqEl.current?.select();
      } catch {
        /* ignore */
      }
    }, 90);
  };

  // Keep the current picture's card in view inside the rail (never scrolls the page).
  useEffect(() => {
    const L = rail.current;
    const el = L?.querySelector<HTMLElement>(".pl-card.on");
    if (!L || !el) return;
    const lr = L.getBoundingClientRect();
    const er = el.getBoundingClientRect();
    if (er.top < lr.top) L.scrollTop -= lr.top - er.top;
    else if (er.bottom > lr.bottom) L.scrollTop += er.bottom - lr.bottom;
    if (er.left < lr.left) L.scrollLeft -= lr.left - er.left;
    else if (er.right > lr.right) L.scrollLeft += er.right - lr.right;
  }, [cur, topic, mode]);

  // Seeking while idle or finished starts the video at that point (the visitor's press: sound on).
  const heroSeek = (t: number, force?: boolean) => {
    const el = hv.current;
    const restart = modeRef.current !== "playing";
    const x = Math.max(0, Math.min(t, restart ? Math.max(0, dur - 0.2) : dur));
    if (restart) {
      clearTimeout(timers.current.a1);
      clearTimeout(timers.current.ae);
      clearInterval(tyRef.current);
      pauseOthers("hero");
      touched.current = true;
      setModeBoth("playing");
      setMuted(false);
    }
    setVt(x);
    if (!el) return;
    try {
      el.currentTime = x;
      if (restart || (force && el.paused)) {
        if (restart) el.muted = false;
        const p = el.play();
        if (p && p.catch) {
          p.catch(() => {
            el.muted = true;
            setMuted(true);
            el.play().catch(() => {});
          });
        }
      }
    } catch {
      /* ignore */
    }
  };

  const toggleSound = () => {
    const m = !muted;
    const el = hv.current;
    if (el) {
      try {
        el.muted = m;
        if (!m && el.paused && modeRef.current !== "idle") el.play().catch(() => {});
      } catch {
        /* ignore */
      }
    }
    touched.current = true;
    setMuted(m);
  };

  const replayBtn = (
    <button type="button" className="ibtn" onClick={() => go(true)} aria-label="Replay the explanation">
      <svg viewBox="0 0 24 24"><path d="M4 12a8 8 0 1 0 2.5-5.8" /><path d="M4 4v4h4" /></svg>
      Replay
    </button>
  );
  const maxBtn = (
    <button
      type="button"
      className="ibtn"
      aria-label="Open in the big player"
      title="Maximise"
      onClick={(e) => {
        let at = 0;
        try {
          at = hv.current?.currentTime ?? 0;
        } catch {
          /* ignore */
        }
        player.open(tp.slug, at, e.currentTarget);
      }}
    >
      <svg viewBox="0 0 24 24"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" /></svg>
    </button>
  );
  const soundBtn = (
    <button type="button" className="ibtn" aria-pressed={!muted} aria-label={muted ? "Sound off — turn on" : "Sound on — turn off"} onClick={toggleSound}>
      <svg viewBox="0 0 24 24">
        <path d="M11 5 6 9H2v6h4l5 4z" />
        <path d={muted ? "M16 9l5 6M21 9l-5 6" : "M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14"} />
      </svg>
    </button>
  );

  return (
    <section style={{ position: "relative", padding: "clamp(40px, 6vw, 80px) 0 clamp(72px, 9vw, 112px)" }}>
      <div
        aria-hidden="true"
        style={{ position: "absolute", right: "-10%", top: "-6%", width: 960, height: 760, pointerEvents: "none", background: "radial-gradient(45% 45% at 60% 40%, rgba(108,77,246,0.10), rgba(108,77,246,0) 70%), radial-gradient(35% 35% at 80% 20%, rgba(255,194,58,0.12), rgba(255,194,58,0) 70%)" }}
      />
      <div className="wrapx wide hero-grid" style={{ position: "relative" }}>
        {/* left: the promise and the action */}
        <div className="hero-copy" style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 24 }}>
          <h1 className="disp rise d1" style={{ margin: 0, fontSize: "clamp(46px, 5.2vw, 74px)", lineHeight: 1.02, letterSpacing: "-0.045em", fontWeight: 600, color: "#221E3F" }}>
            Understand anything in{" "}
            <span className="uline">
              seconds.
              <svg viewBox="0 0 300 24" aria-hidden="true">
                <path d="M4 16 C 70 6, 170 4, 296 11" />
              </svg>
            </span>
          </h1>
          <p className="rise d2" style={{ margin: 0, maxWidth: 430, fontSize: "clamp(18px, 1.5vw, 20px)", lineHeight: 1.6, color: "#57536E", textWrap: "pretty" }}>
            Select text on Windows and press <span className="kbd">Alt</span> + <span className="kbd">E</span>. Tubelight turns it into a short visual explanation with pictures, captions, and narration. You can also type a topic.
          </p>
          <div className="rise d3 hero-act" style={{ width: "100%", display: "flex", flexDirection: "column", gap: 14, marginTop: 2 }}>
            {!w.sent ? <SignupForm id="em-hero" placement="hero" label="Join the waitlist" /> : <Joined />}
            <p className="conds">
              <span><svg viewBox="0 0 24 24" aria-hidden="true">{CHECK}</svg>Free to try</span>
              <span><svg viewBox="0 0 24 24" aria-hidden="true">{CHECK}</svg>Windows 10 &amp; 11</span>
            </p>
            <p className="onlysm micro">Tubelight runs on Windows PCs. Join from your phone and your invite comes by email, so you can open it on your PC.</p>
            <InviteStatus />
            <div className="hero-links">
              <a href="#how" className="linkbtn">
                <svg viewBox="0 0 24 24" aria-hidden="true" style={{ width: 18, height: 18, fill: "#4B33B8" }}>
                  <path d="M7 4.5v15l12.5-7.5z" />
                </svg>
                Watch the demo (0:49)
              </a>
              <a
                href="#examples"
                className="linkbtn"
                onClick={(e) => {
                  e.preventDefault();
                  try {
                    document.getElementById("examples")?.scrollIntoView({ behavior: "smooth", block: "start" });
                  } catch {
                    /* ignore */
                  }
                  setTimeout(() => {
                    try {
                      document.getElementById("topic-q")?.focus({ preventScroll: true });
                    } catch {
                      /* ignore */
                    }
                  }, 500);
                }}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true" style={{ width: 18, height: 18, fill: "none", stroke: "#4B33B8", strokeWidth: 2.2, strokeLinecap: "round" }}>
                  <path d="M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-3.5-3.5" />
                </svg>
                Try it with your own topic
              </a>
            </div>
          </div>
        </div>

        {/* right: the product, live, with a real explanation */}
        <div
          id="demo"
          className="rise d4"
          onKeyDown={(e) => {
            if (!ask && e.altKey && (e.code === "KeyE" || e.key === "e" || e.key === "E")) {
              e.preventDefault();
              go(true);
            }
          }}
        >
          <div className="modes">
            <div className="modeseg" role="group" aria-label="How do you want to ask?">
              <button type="button" className={"mode" + (ask ? " on" : "")} aria-pressed={ask} onClick={() => switchWay("type")}>
                <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
                Search a topic
              </button>
              <button type="button" className={"mode" + (ask ? "" : " on")} aria-pressed={!ask} onClick={() => switchWay("select")}>
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h10M4 12h16M4 17h7" /><path d="M15 15l5 5" /></svg>
                Select text · Alt + E
              </button>
            </div>
          </div>
          <div className={"desk" + (ask ? " ask" : "") + (idle ? "" : ask ? " play" : " split")}>
            <div className="win wdoc">
              <div className="wbar">
                <span style={{ display: "flex", alignItems: "center", gap: 9, minWidth: 0 }}>
                  <span aria-hidden="true" style={{ width: 12, height: 12, borderRadius: 4, flex: "none", background: tp.color }} />
                  <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{tp.app}</span>
                </span>
                <span className="wctl" aria-hidden="true">— ▢ ✕</span>
              </div>
              <div className="wbody">
                <p className="wkick">{tp.kicker}</p>
                <p className="disp wtitle">{tp.title}</p>
                <p className="wlead" style={{ margin: 0 }}>{tp.lead}</p>
                <p style={{ margin: 0 }}>
                  <span className="selx">{tp.sel}</span> {tp.tail}
                </p>
              </div>
            </div>

            <div className="win wask">
              <div className="wbar">
                <span style={{ display: "flex", alignItems: "center", gap: 9, minWidth: 0 }}>
                  <img src="/brand/mark.png" alt="" style={{ display: "block", width: 20, height: "auto" }} />
                  <span style={{ whiteSpace: "nowrap" }}>Tubelight</span>
                </span>
                <span aria-hidden="true" style={{ display: "flex", gap: 14, color: "#A29DB5", fontSize: 12, fontWeight: 500, flex: "none" }}>— ▢ ✕</span>
              </div>
              <form className="askwrap" role="search" onSubmit={submitTopic}>
                <p className="disp" style={{ margin: 0, fontSize: 21, lineHeight: 1.2, fontWeight: 600, letterSpacing: "-0.02em", color: "#221E3F" }}>What do you want to understand?</p>
                <div className="askrow">
                  <div className="askbox">
                    <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
                    <label htmlFor="hero-q" className="sr">Search a topic</label>
                    <input
                      id="hero-q"
                      ref={hqEl}
                      className="askin"
                      type="text"
                      autoComplete="off"
                      maxLength={200}
                      value={hq}
                      onChange={(e) => {
                        stopTyping();
                        setHq(e.target.value);
                      }}
                      onFocus={(e) => {
                        stopTyping();
                        justFocused.current = true;
                        e.currentTarget.select();
                      }}
                      onMouseUp={(e) => {
                        if (justFocused.current) {
                          e.preventDefault();
                          justFocused.current = false;
                        }
                      }}
                    />
                  </div>
                  <button type="submit" className="btn go" ref={goBtn}>
                    Explain it
                    <span className={"enterkey" + (pressed ? " pressed" : "")} aria-hidden="true">Enter</span>
                  </button>
                </div>
                <p className="hint">
                  <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="8" y="3" width="8" height="4" rx="1" /><path d="M8 5H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" /></svg>
                  You can paste a whole paragraph too.
                </p>
                <p className="hint">
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z" /></svg>
                  Your own topic? Press Enter for a free preview · about 20 s · email needed to watch
                </p>
              </form>
            </div>

            <div className="win wpan" ref={panel}>
              <div className="wpan-in">
                {ask ? (
                  <div className="wbar abar">
                    <img src="/brand/mark.png" alt="" style={{ display: "block", width: 20, height: "auto" }} />
                    <button type="button" className="spill" aria-label={"Topic: " + tp.typed + ". Search another topic"} title="Search another topic" onClick={editTopic}>
                      <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
                      <span>{tp.typed}</span>
                    </button>
                    <span className="grp">
                      {done ? replayBtn : null}
                      {soundBtn}
                      {maxBtn}
                    </span>
                  </div>
                ) : (
                  <div className="wbar">
                    <span style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                      <img src="/brand/mark.png" alt="" style={{ display: "block", width: 20, height: "auto" }} />
                      <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{v?.title ?? ""}</span>
                    </span>
                    <span style={{ display: "flex", alignItems: "center", gap: 2, flex: "none" }}>
                      {done ? replayBtn : null}
                      {maxBtn}
                      {soundBtn}
                    </span>
                  </div>
                )}
                <div className={"pbody" + (ask ? " app" : "")}>
                  <div className="pmain">
                    <div className="pvid">
                      <video
                        ref={hv}
                        src={v?.src}
                        poster={v?.poster}
                        playsInline
                        muted={muted}
                        preload="metadata"
                        onLoadedData={(e) => {
                          if (modeRef.current === "playing" && e.currentTarget.paused) {
                            e.currentTarget.play().catch(() => setPaused(true));
                          }
                        }}
                        onTimeUpdate={(e) => setVt(e.currentTarget.currentTime)}
                        onEnded={() => {
                          if (reduceRef.current) {
                            setModeBoth("done");
                            setPaused(true);
                            return;
                          }
                          const next = (topicRef.current + 1) % HERO.length;
                          topicRef.current = next;
                          setTopic(next);
                          setHq(HERO[next].typed);
                          setVt(0);
                        }}
                        onPlay={() => setPaused(false)}
                        onPause={() => setPaused(true)}
                        aria-label={"Tubelight explanation: " + (v?.title ?? "")}
                      />
                      <Pointer video={hv} t={vt} playing={live} beats={v?.beats} sheets={v?.sheets} />
                      {!idle && muted ? (
                        <button type="button" className="mutepill" onClick={toggleSound}>
                          <svg viewBox="0 0 24 24"><path d="M11 5 6 9H2v6h4l5 4z" /><path d="M16 9l5 6M21 9l-5 6" /></svg>
                          Tap for sound
                        </button>
                      ) : null}
                    </div>
                    <p className="caps" aria-live="polite">{idle ? (ask ? " " : "Press Alt + E to explain the highlighted text.") : cueAt(cues, vt) || " "}</p>
                    <div className="prog">
                      <button type="button" className="pp" aria-label={paused ? "Play" : "Pause"} onClick={togglePlay}>
                        <svg viewBox="0 0 24 24" aria-hidden="true"><path d={paused ? "M7 4.5v15l12.5-7.5z" : "M7 5h3.5v14H7zM13.5 5H17v14h-3.5z"} /></svg>
                      </button>
                      <Seek time={vt} duration={dur} onSeek={heroSeek} />
                      <span className="ptime">{mmss(vt)} / {mmss(dur)}</span>
                    </div>
                  </div>
                  {ask ? (
                    <div className="prail-wrap">
                      <div className="pl-rail">
                        <div className="pl-rail-h"><span>Slides</span><small>{shs.length} slides</small></div>
                        <div className="pl-list" ref={rail}>
                          {shs.map((sh, i) => {
                            const on = i === cur;
                            return (
                              <button
                                key={i}
                                type="button"
                                className={"pl-card" + (on ? " on" : "")}
                                aria-current={on ? "true" : undefined}
                                aria-label={"Picture " + (i + 1) + (sh.title ? ": " + sh.title : "") + ", starts at " + mmss(sh.start)}
                                onClick={() => heroSeek(sh.start, true)}
                              >
                                <span className="pl-thumb">
                                  <img src={sh.thumb} alt="" />
                                  <span className="pl-num">{i + 1}</span>
                                </span>
                                <span className="pl-ct">
                                  {sh.title || "Picture " + (i + 1)}
                                  {on && live ? <span className="pl-wave" aria-hidden="true"><i /><i /><i /></span> : null}
                                </span>
                                <span className="pl-cs">{mmss(sh.start)}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>

          {!ask ? (
            <div className="keyrow">
              <button type="button" className={"keybtn" + (idle ? " ready" : "") + (pressed ? " pressed" : "")} onClick={() => go(true)} aria-label="Press Alt plus E to explain the highlighted text">
                <span className="key">Alt</span>
                <span aria-hidden="true" style={{ color: "#A29DB5", fontSize: 18 }}>+</span>
                <span className="key">E</span>
                <span style={{ marginLeft: 6 }}>{idle ? (coarse ? "Tap to explain the highlighted text" : "Explain the highlighted text") : "Explain it again"}</span>
              </button>
            </div>
          ) : null}
          <div className="tchips">
            <span style={{ fontSize: 14.5, color: "#6F6B86", marginRight: 2 }}>Try another:</span>
            {HERO.map((x, i) => (
              <button key={x.slug} type="button" className={"tchip" + (topic === i ? " on" : "")} aria-pressed={topic === i} onClick={() => pickTopic(i)}>
                <span className="tdot" aria-hidden="true" style={{ background: x.color }} />
                {x.label}
              </button>
            ))}
          </div>
          <p className="micro" style={{ margin: "10px 0 0", color: "#6F6B86" }}>Curated examples · {shs.length} pictures with narration · the ring follows what’s being explained</p>
        </div>
      </div>
    </section>
  );
}
