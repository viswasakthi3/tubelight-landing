"use client";

import { useLightbox, useVideos } from "./Providers";

const SAVED = ["dna", "polar-bear", "ocean", "insurance"];

const rowStyle: React.CSSProperties = { display: "flex", justifyContent: "space-between", alignItems: "center", height: 40, padding: "0 14px", borderRadius: 12, background: "#FFFFFF", fontSize: 14.5, fontWeight: 600 };

export function Features() {
  const videos = useVideos();
  const lb = useLightbox();
  return (
    <section id="features" className="sec" style={{ paddingTop: 0, scrollMarginTop: 76 }}>
      <div className="wrapx">
        <div className="head">
          <h2 className="h2">Everything it can do.</h2>
          <p className="lede">One shortcut to start. A few extras when you need them.</p>
        </div>
        <div className="bento">
          <div className="tile s4" style={{ background: "#F1ECFF" }}>
            <div className="tv" aria-hidden="true" style={{ background: "#FFFFFF", gap: 16, padding: "0 22px", justifyContent: "space-between" }}>
              <span style={{ flex: 1, maxWidth: 220, fontSize: 14, lineHeight: 1.6, color: "#3A3655" }}>
                …where they <span className="selx">burn and rush out through the nozzle.</span>
              </span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6, flex: "none" }}>
                <span className="key" style={{ minWidth: 50, height: 44, fontSize: 15 }}>Alt</span>
                <span style={{ color: "#A29DB5" }}>+</span>
                <span className="key" style={{ minWidth: 44, height: 44, fontSize: 15 }}>E</span>
              </span>
              <img className="hide-sm" src={videos.rocket?.thumb ?? "/videos/rocket-thumb.webp"} alt="" loading="lazy" style={{ display: "block", width: 200, height: 112, objectFit: "cover", borderRadius: 12, flex: "none" }} />
            </div>
            <h3>Explain anything you select</h3>
            <p>Select text and press Alt + E. A short explanation with pictures and a voice opens beside your page.</p>
          </div>

          <div className="tile s2" style={{ background: "#FFFFFF", boxShadow: "0 0 0 1px #ECE7F3" }}>
            <div className="tv" aria-hidden="true" style={{ alignItems: "stretch", justifyContent: "stretch" }}>
              <img src={videos.ocean?.thumb ?? "/videos/ocean-thumb.webp"} alt="" loading="lazy" style={{ display: "block", width: "100%", height: "100%", objectFit: "cover" }} />
              <span style={{ position: "absolute", left: 10, right: 10, bottom: 10, padding: "8px 10px", borderRadius: 10, background: "rgba(255,255,255,0.94)", color: "#221E3F", fontSize: 13, fontWeight: 500, textAlign: "center" }}>Captions follow the voice.</span>
            </div>
            <h3>See it. Hear it.</h3>
            <p>Every answer is pictures, a voice and captions.</p>
          </div>

          <div className="tile s2" style={{ background: "#E6F1FF" }}>
            <div className="tv" aria-hidden="true" style={{ flexDirection: "column", alignItems: "stretch", gap: 8, padding: "0 18px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, height: 46, padding: "0 14px", borderRadius: 14, background: "#FFFFFF", boxShadow: "0 0 0 2px #3B8EF0" }}>
                <svg viewBox="0 0 24 24" style={{ width: 18, height: 18, fill: "none", stroke: "#1E5AA8", strokeWidth: 2, strokeLinecap: "round" }}>
                  <circle cx="11" cy="11" r="7" />
                  <path d="m20 20-3.5-3.5" />
                </svg>
                <span style={{ fontSize: 15, color: "#221E3F" }}>
                  black ho<span style={{ display: "inline-block", width: 2, height: 16, background: "#221E3F", verticalAlign: -2 }} />
                </span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 2, padding: "8px 14px", borderRadius: 14, background: "#FFFFFF", fontSize: 14, color: "#57536E" }}>
                <span>Black hole</span>
                <span>Supermassive black hole</span>
              </div>
            </div>
            <h3>Just type a topic</h3>
            <p>Nothing to select? Type it and get the same kind of explanation.</p>
          </div>

          <div className="tile s2" style={{ background: "#FFF4D6" }}>
            <div className="tv" aria-hidden="true" style={{ flexDirection: "column", alignItems: "stretch", gap: 8, padding: "0 18px" }}>
              <div style={rowStyle}><span>Fast</span><span style={{ color: "#8A5A00" }}>about 15 s</span></div>
              <div style={rowStyle}><span>Balanced</span><span style={{ color: "#8A5A00" }}>about 20 s</span></div>
              <div style={{ ...rowStyle, background: "#FFC94A", color: "#3D2800" }}><span>Rich visuals</span><span>about 30 s</span></div>
            </div>
            <h3>Quick or deep</h3>
            <p>Get the gist fast, or a fuller story with more pictures.</p>
          </div>

          <div className="tile s2" style={{ background: "#E3F6EC" }}>
            <div className="tv" aria-hidden="true" style={{ flexDirection: "column", alignItems: "stretch", gap: 8, padding: "0 18px" }}>
              <span style={{ alignSelf: "flex-end", padding: "8px 14px", borderRadius: "16px 16px 4px 16px", background: "#22B573", color: "#FFFFFF", fontSize: 14, fontWeight: 600 }}>Explain it simpler</span>
              <span style={{ alignSelf: "flex-start", maxWidth: "92%", padding: "9px 14px", borderRadius: "4px 16px 16px 16px", background: "#FFFFFF", fontSize: 14, lineHeight: 1.45, color: "#221E3F" }}>Pinch a garden hose and the water shoots out faster. A nozzle does the same.</span>
            </div>
            <h3>Ask follow-ups</h3>
            <p>Didn’t click? Ask for it simpler, step by step, or with an example.</p>
          </div>

          <div className="tile s3" style={{ background: "#FFEDE7" }}>
            <div className="tv" aria-hidden="true" style={{ flexDirection: "column", gap: 16 }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                <span className="key" style={{ minWidth: 62, height: 48, background: "#FFFFFF", borderColor: "#F2C7B9", boxShadow: "0 4px 0 #E9AE9B", color: "#A63A1E" }}>Tab</span>
                <span style={{ color: "#C98A77" }}>+</span>
                <span className="key" style={{ minWidth: 48, height: 48, background: "#FFFFFF", borderColor: "#F2C7B9", boxShadow: "0 4px 0 #E9AE9B", color: "#A63A1E" }}>R</span>
              </span>
              <span style={{ maxWidth: 300, fontSize: 14, lineHeight: 1.6, color: "#6F6B86", textAlign: "center" }}>
                <span style={{ background: "#FFD3C4", color: "#221E3F", borderRadius: 3 }}>A star shines because it fuses hydrogen</span> into helium in its core…
              </span>
            </div>
            <h3>Read it aloud</h3>
            <p>Too long to read? Select it, press Tab + R, and listen while you follow along.</p>
          </div>

          <div className="tile s3" style={{ background: "#FFFFFF", boxShadow: "0 0 0 1px #ECE7F3" }}>
            <div className="tv sgrid">
              {SAVED.map((k) => {
                const v = videos[k];
                if (!v) return null;
                return (
                  <button key={k} type="button" className="sthumb" onClick={() => lb.open(k)} aria-label={`Replay saved explanation: ${v.title}`}>
                    <img src={v.thumb} alt="" loading="lazy" />
                    <span className="gplay" aria-hidden="true">
                      <i><svg viewBox="0 0 24 24"><path d="M7 4.5v15l12.5-7.5z" /></svg></i>
                    </span>
                  </button>
                );
              })}
            </div>
            <h3>Everything saved</h3>
            <p>Every explanation is saved on your PC until you delete it. Click one above to replay it.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
