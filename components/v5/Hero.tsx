"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { track } from "@/lib/track";
import { useVideos } from "./Providers";
import { Joined, SignupForm, useProof } from "./SignupForm";
import { cueAt, mmss, pauseOthers, registerPauser } from "./media";
import { useWaitlist } from "./WaitlistContext";

const HERO = [
  { slug: "rocket", label: "Rockets", color: "#FF6F4F", app: "Rockets.pdf", kicker: "Physics · Chapter 4", title: "How rockets fly",
    lead: "A rocket carries everything it needs to burn, because there is no air in space.",
    sel: "Liquid fuel and liquid oxygen are pumped into the combustion chamber, where they burn and rush out through the nozzle.", tail: "The hot gas going down pushes the rocket up." },
  { slug: "headaches", label: "Headaches", color: "#22B573", app: "Health article", kicker: "Wellbeing", title: "Small habits, better weeks",
    lead: "Keep a bottle of water on your desk and take a short walk after lunch.",
    sel: "Why do headaches happen if the brain itself can’t feel pain?", tail: "The answer is in the layers around it." },
  { slug: "dna", label: "DNA", color: "#3B8EF0", app: "Biology notes.docx", kicker: "Biology · Unit 3", title: "Genetics",
    lead: "Every living cell carries a full set of instructions for life.",
    sel: "DNA is built from nucleotides that pair up and twist into a double helix.", tail: "Its base pairs spell out the genetic code." },
];

type Mode = "idle" | "playing" | "done";

const CHECK = <path d="m5 12 5 5 9-10" />;

export function Hero() {
  const videos = useVideos();
  const w = useWaitlist();
  const proof = useProof();
  const [topic, setTopic] = useState(0);
  const [mode, setMode] = useState<Mode>("idle");
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
  const timers = useRef<{ a1?: ReturnType<typeof setTimeout>; p1?: ReturnType<typeof setTimeout> }>({});
  const topicRef = useRef(0);

  const setModeBoth = (m: Mode) => {
    modeRef.current = m;
    setMode(m);
  };

  const go = useCallback((byUser: boolean) => {
    clearTimeout(timers.current.a1);
    clearTimeout(timers.current.p1);
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

  useEffect(() => {
    const t = timers.current;
    const off = registerPauser("hero", () => hv.current?.pause());
    let reduce = false;
    try {
      reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    } catch {
      /* ignore */
    }
    if (!reduce) {
      t.a1 = setTimeout(() => {
        if (!touched.current) go(false);
      }, 1800);
    }
    return () => {
      off();
      clearTimeout(t.a1);
      clearTimeout(t.p1);
    };
  }, [go]);

  const pickTopic = (i: number) => {
    clearTimeout(timers.current.a1);
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
  };

  const tp = HERO[topic];
  const v = videos[tp.slug];
  const idle = mode === "idle";
  const playing = mode === "playing" && !paused;
  const done = mode === "done";
  const dur = v?.shortDuration || v?.duration || 0;
  const cues = v?.shortCues || v?.cues;
  const pct = dur ? Math.min(100, Math.round((vt / dur) * 1000) / 10) : 0;

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

  return (
    <section style={{ position: "relative", padding: "clamp(40px, 6vw, 80px) 0 clamp(72px, 9vw, 112px)" }}>
      <div
        aria-hidden="true"
        style={{ position: "absolute", right: "-10%", top: "-6%", width: 960, height: 760, pointerEvents: "none", background: "radial-gradient(45% 45% at 60% 40%, rgba(108,77,246,0.10), rgba(108,77,246,0) 70%), radial-gradient(35% 35% at 80% 20%, rgba(255,194,58,0.12), rgba(255,194,58,0) 70%)" }}
      />
      <div className="wrapx wide hero-grid" style={{ position: "relative" }}>
        {/* left: the promise and the action */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 24 }}>
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
            Select any text on your Windows PC and press <span className="kbd">Alt</span> + <span className="kbd">E</span>. Tubelight explains it with pictures and a voice, right beside what you’re reading.
          </p>
          <div className="rise d3" style={{ width: "100%", display: "flex", flexDirection: "column", gap: 14, marginTop: 2 }}>
            {!w.sent ? <SignupForm id="em-hero" placement="hero" label="Join the waitlist" /> : <Joined />}
            <p className="conds">
              <span><svg viewBox="0 0 24 24" aria-hidden="true">{CHECK}</svg>Free to try</span>
              <span><svg viewBox="0 0 24 24" aria-hidden="true">{CHECK}</svg>Windows 10 &amp; 11</span>
              <span><svg viewBox="0 0 24 24" aria-hidden="true">{CHECK}</svg>Invites in line order</span>
            </p>
            <div className="proof">
              <span className="live" aria-hidden="true" />
              <span>
                <strong>{proof.main}</strong>
                {proof.rest}
              </span>
              {proof.week ? <span className="week">+{proof.week} this week</span> : null}
            </div>
            <a href="#how" className="linkbtn" style={{ alignSelf: "flex-start", marginTop: 2 }}>
              <svg viewBox="0 0 24 24" aria-hidden="true" style={{ width: 18, height: 18, fill: "#4B33B8" }}>
                <path d="M7 4.5v15l12.5-7.5z" />
              </svg>
              Watch the demo (1:21)
            </a>
          </div>
        </div>

        {/* right: the product, live, with a real explanation */}
        <div
          id="demo"
          className="rise d4"
          onKeyDown={(e) => {
            if (e.altKey && (e.code === "KeyE" || e.key === "e" || e.key === "E")) {
              e.preventDefault();
              go(true);
            }
          }}
        >
          <div className={"desk" + (idle ? "" : " split")}>
            <div className="win wdoc">
              <div className="wbar">
                <span style={{ display: "flex", alignItems: "center", gap: 9, minWidth: 0 }}>
                  <span aria-hidden="true" style={{ width: 12, height: 12, borderRadius: 4, flex: "none", background: tp.color }} />
                  <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{tp.app}</span>
                </span>
                <span aria-hidden="true" style={{ display: "flex", gap: 14, color: "#A29DB5", fontSize: 12, fontWeight: 500, flex: "none" }}>— ▢ ✕</span>
              </div>
              <div className="wbody">
                <p style={{ margin: 0, fontSize: 12, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "#6F6B86" }}>{tp.kicker}</p>
                <p className="disp" style={{ margin: 0, fontSize: 21, lineHeight: 1.2, fontWeight: 600, letterSpacing: "-0.02em", color: "#221E3F" }}>{tp.title}</p>
                <p style={{ margin: 0 }}>{tp.lead}</p>
                <p style={{ margin: 0 }}>
                  <span className="selx">{tp.sel}</span> {tp.tail}
                </p>
              </div>
            </div>

            <div className="win wpan" ref={panel}>
              <div className="wpan-in">
                <div className="wbar">
                  <span style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                    <img src="/brand/mark.png" alt="" style={{ display: "block", width: 20, height: "auto" }} />
                    <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{v?.title ?? ""}</span>
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: 2, flex: "none" }}>
                    {done ? (
                      <button type="button" className="ibtn" onClick={() => go(true)} aria-label="Replay the explanation">
                        <svg viewBox="0 0 24 24"><path d="M4 12a8 8 0 1 0 2.5-5.8" /><path d="M4 4v4h4" /></svg>
                        Replay
                      </button>
                    ) : null}
                    <button type="button" className="ibtn" aria-label={paused ? "Play" : "Pause"} onClick={togglePlay}>
                      <svg viewBox="0 0 24 24"><path d={paused ? "M7 4.5v15l12.5-7.5z" : "M8 5v14M16 5v14"} /></svg>
                    </button>
                    <button type="button" className="ibtn" aria-pressed={!muted} aria-label={muted ? "Sound off — turn on" : "Sound on — turn off"} onClick={toggleSound}>
                      <svg viewBox="0 0 24 24">
                        <path d="M11 5 6 9H2v6h4l5 4z" />
                        <path d={muted ? "M16 9l5 6M21 9l-5 6" : "M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14"} />
                      </svg>
                    </button>
                  </span>
                </div>
                <div className="pbody">
                  <div className="pvid">
                    <video
                      ref={hv}
                      src={v?.shortSrc || v?.src}
                      poster={v?.poster}
                      playsInline
                      muted
                      preload="metadata"
                      onTimeUpdate={(e) => setVt(e.currentTarget.currentTime)}
                      onEnded={() => {
                        setModeBoth("done");
                        setPaused(true);
                      }}
                      onPlay={() => setPaused(false)}
                      onPause={() => setPaused(true)}
                      aria-label={"Tubelight explanation: " + (v?.title ?? "")}
                    />
                    {!idle && muted ? (
                      <button type="button" className="mutepill" onClick={toggleSound}>
                        <svg viewBox="0 0 24 24"><path d="M11 5 6 9H2v6h4l5 4z" /><path d="M16 9l5 6M21 9l-5 6" /></svg>
                        Tap for sound
                      </button>
                    ) : null}
                  </div>
                  <p className="caps" aria-live="polite">{idle ? "Press Alt + E to explain the highlighted text." : cueAt(cues, vt) || " "}</p>
                  <div className="prog">
                    <span className={"wave" + (playing && !muted ? " live" : "")} aria-hidden="true"><span /><span /><span /><span /></span>
                    <div className="track"><div className="fill" style={{ width: pct + "%" }} /></div>
                    <span style={{ fontSize: 12.5, fontWeight: 500, color: "#6F6B86", minWidth: 74, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                      {mmss(vt)} / {mmss(dur)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="keyrow">
            <button type="button" className={"keybtn" + (idle ? " ready" : "") + (pressed ? " pressed" : "")} onClick={() => go(true)} aria-label="Press Alt plus E to explain the highlighted text">
              <span className="key">Alt</span>
              <span aria-hidden="true" style={{ color: "#A29DB5", fontSize: 18 }}>+</span>
              <span className="key">E</span>
              <span style={{ marginLeft: 6 }}>{idle ? (coarse ? "Tap to explain the highlighted text" : "Explain the highlighted text") : "Explain it again"}</span>
            </button>
          </div>
          <div className="tchips">
            <span style={{ fontSize: 14.5, color: "#6F6B86", marginRight: 2 }}>Try another:</span>
            {HERO.map((x, i) => (
              <button key={x.slug} type="button" className={"tchip" + (topic === i ? " on" : "")} aria-pressed={topic === i} onClick={() => pickTopic(i)}>
                <span className="tdot" aria-hidden="true" style={{ background: x.color }} />
                {x.label}
              </button>
            ))}
          </div>
          <p className="real">Real Tubelight explanations of these topics, in its own voice. Making one takes about 10–30 seconds; here it plays straight away. The page is a sample.</p>
        </div>
      </div>
    </section>
  );
}
