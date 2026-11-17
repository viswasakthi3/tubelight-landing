"use client";

import { GALLERY } from "./catalog";
import { mmss } from "./media";
import { usePlayer, useVideos } from "./Providers";
import { TopicSearch } from "./TopicSearch";

export function Gallery() {
  const videos = useVideos();
  const player = usePlayer();

  return (
    <section id="examples" className="sec" style={{ paddingTop: 0, scrollMarginTop: 76 }}>
      <div className="wrapx">
        <div className="head">
          <h2 className="h2">Curious about anything?</h2>
          <p className="lede">Search any topic and Tubelight makes a free preview video for you, right here. Or play an example below to see how a visual explanation works.</p>
        </div>
        <TopicSearch />
        <p className="sfine">Free preview: one a day, about 20 seconds to make, and you’ll enter your email to watch it. Your topic is sent to our servers to make the video.</p>
        <div className="gal">
          {GALLERY.map((g) => {
            const v = videos[g.slug];
            if (!v) return null;
            return (
              <button
                key={g.slug}
                type="button"
                className="gcard"
                onClick={() => player.open(g.slug, 0)}
                aria-label={`Play: ${v.title}, ${mmss(v.duration)}`}
              >
                <span className="gpic">
                  <img src={v.thumb} alt="" loading="lazy" />
                  <span className="gpm" aria-hidden="true">
                    <svg viewBox="0 0 24 24"><path d="M8 5.5v13l10.5-6.5z" /></svg>
                  </span>
                  <span className="glen" aria-hidden="true">{mmss(v.duration)}</span>
                </span>
                <span className="gtag" style={{ background: g.bg, color: g.fg }}>{g.tag}</span>
                <span className="gtitle">{v.title}</span>
              </button>
            );
          })}
        </div>
        <p style={{ margin: "34px 0 0", fontSize: 15, color: "#6F6B86" }}>Curated examples and saved explanations from the Windows app. It’s AI, so it can slip now and then — if something looks off, ask a follow-up.</p>
      </div>
    </section>
  );
}
