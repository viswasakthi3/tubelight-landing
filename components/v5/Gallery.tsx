"use client";

import { useLightbox, useVideos } from "./Providers";
import { mmss } from "./media";

const GALLERY = [
  { slug: "rocket", tag: "Science", bg: "#FFEDE7", fg: "#A63A1E" },
  { slug: "headaches", tag: "Health", bg: "#E3F6EC", fg: "#146B44" },
  { slug: "ocean", tag: "Geography", bg: "#E6F1FF", fg: "#1E5AA8" },
  { slug: "tv", tag: "Tech", bg: "#F1ECFF", fg: "#4B33B8" },
  { slug: "polar-bear", tag: "Nature", bg: "#FFF4D6", fg: "#8A5A00" },
  { slug: "insurance", tag: "Money", bg: "#FFEDE7", fg: "#A63A1E" },
];

export function Gallery() {
  const videos = useVideos();
  const lb = useLightbox();
  return (
    <section id="examples" className="sec" style={{ paddingTop: 0, scrollMarginTop: 76 }}>
      <div className="wrapx">
        <div className="head">
          <h2 className="h2">Curious about anything?</h2>
          <p className="lede">These are real explanations Tubelight made — pictures, voice and all. Press play on any of them.</p>
        </div>
        <div className="gal">
          {GALLERY.map((g) => {
            const v = videos[g.slug];
            if (!v) return null;
            return (
              <button key={g.slug} type="button" className="gcard" onClick={() => lb.open(g.slug)} aria-label={`Play: ${v.title}, ${mmss(v.duration)}`}>
                <span className="gpic">
                  <img src={v.thumb} alt="" loading="lazy" />
                  <span className="gplay" aria-hidden="true">
                    <i><svg viewBox="0 0 24 24"><path d="M7 4.5v15l12.5-7.5z" /></svg></i>
                    {mmss(v.duration)}
                  </span>
                </span>
                <span className="gtag" style={{ background: g.bg, color: g.fg }}>{g.tag}</span>
                <span className="gtitle">{v.title}</span>
              </button>
            );
          })}
        </div>
        <p style={{ margin: "34px 0 0", fontSize: 15, color: "#6F6B86" }}>Unedited output from the Windows app. It’s AI, so it can slip now and then — if something looks off, ask a follow-up.</p>
      </div>
    </section>
  );
}
