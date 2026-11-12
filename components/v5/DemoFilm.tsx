"use client";

import { useEffect, useRef, useState } from "react";
import { track } from "@/lib/track";
import { DEMO } from "@/lib/video-paths";
import { pauseOthers, registerPauser } from "./media";

export function DemoFilm() {
  const [on, setOn] = useState(false);
  const dv = useRef<HTMLVideoElement | null>(null);

  useEffect(() => registerPauser("demo", () => dv.current?.pause()), []);

  const play = () => {
    pauseOthers("demo");
    setOn(true);
    track("demo_video_play");
    const el = dv.current;
    if (el) {
      try {
        el.muted = false;
        el.play().catch(() => {});
      } catch {
        /* ignore */
      }
    }
  };

  return (
    <section id="how" className="sec" style={{ paddingTop: 0, scrollMarginTop: 76 }}>
      <div className="wrapx">
        <div className="head">
          <h2 className="h2">See it on a real PC.</h2>
          <p className="lede">Three steps, no new tab. Here’s Tubelight on a real Windows PC.</p>
        </div>
        <div className="film">
          <video
            ref={dv}
            src={DEMO.src}
            poster={DEMO.poster}
            controls={on}
            playsInline
            preload="none"
            onPlay={() => {
              pauseOthers("demo");
              setOn(true);
            }}
            aria-label="Tubelight demo on a Windows PC"
          />
          {!on ? (
            <button type="button" className="cover" onClick={play} aria-label="Play the Tubelight demo with sound">
              <img src={DEMO.poster} alt="" />
              <span className="bigplay">
                <i aria-hidden="true">
                  <svg viewBox="0 0 24 24"><path d="M7 4.5v15l12.5-7.5z" /></svg>
                </i>
                Watch the demo · 1:21
              </span>
            </button>
          ) : null}
        </div>
        <div className="steps">
          {[
            ["#FFF1CC", "#8A5A00", "1", "Select any text", "In a PDF, a website, Word or Notion — wherever you can select text."],
            ["#EFEAFF", "#4B33B8", "2", "Press Alt + E", "One shortcut. No new tab, nothing to type."],
            ["#E1F6EC", "#146B44", "3", "Watch and listen", "Pictures and a voice explain it, right beside your page. Ask a follow-up if you need to."],
          ].map(([bg, fg, n, h, p]) => (
            <div key={n} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <span className="stepn" style={{ background: bg, color: fg }}>{n}</span>
              <p className="disp" style={{ margin: 0, fontSize: 22, fontWeight: 600, letterSpacing: "-0.02em" }}>{h}</p>
              <p style={{ margin: 0, color: "#57536E" }}>{p}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
