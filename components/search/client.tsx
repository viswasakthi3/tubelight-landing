"use client";

import { useEffect, useRef, useState } from "react";
import { mountDemo } from "./demo";
import { Play, Send, Windows } from "./icons";

export const SITE = "https://search.tubelight.net";
const STORE_ID = "9NFK7MS99FB3";
/** Opens the Store app straight on the product page; `cid` shows per-button installs in Partner Center. */
export const storeUrl = (where: string) => `https://apps.microsoft.com/detail/${STORE_ID}?mode=direct&cid=qs-landing-${where}`;

type PostHogLike = { capture: (event: string, props?: Record<string, unknown>) => void };
/** Analytics if PostHog is on the page; never anything typed. */
export function qsTrack(event: string, props?: Record<string, string | number | boolean>) {
  try {
    const ph = (window as unknown as { posthog?: PostHogLike }).posthog;
    ph?.capture?.(event, props);
  } catch {
    /* never break the page */
  }
}

type Platform = "windows" | "phone" | "other";
function detect(): Platform {
  const ua = navigator.userAgent;
  if (/Android|iPhone|iPad|iPod|Mobile/i.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)) return "phone";
  if (/Windows/i.test(ua)) return "windows";
  return "other";
}

/** The one call to action. Windows: the Store. Phone: send the link to your PC. Mac/Linux: the Store, with a note. */
export function GetButton({ where, size = "lg", tone = "violet", showNote = true }: { where: string; size?: "lg" | "sm"; tone?: "violet" | "white"; showNote?: boolean }) {
  const [platform, setPlatform] = useState<Platform>("windows");
  const [toast, setToast] = useState("");
  useEffect(() => setPlatform(detect()), []);
  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(""), 3200);
    return () => window.clearTimeout(t);
  }, [toast]);

  async function sendToPc() {
    qsTrack("qs_send_to_pc", { where });
    const data = { title: "Quick Search AI", text: "Hold Tab + Q in any app and ask out loud. Free for Windows.", url: SITE };
    try {
      if (navigator.share) { await navigator.share(data); return; }
    } catch (e) {
      if ((e as Error)?.name === "AbortError") return;
    }
    try {
      await navigator.clipboard.writeText(SITE);
      setToast("Link copied. Open it on your Windows PC.");
    } catch {
      setToast("Open search.tubelight.net on your Windows PC.");
    }
  }

  const small = size === "sm";
  const cls = `qs-btn${small ? " sm" : ""}${tone === "white" ? " white" : ""}`;
  const button =
    platform === "phone" ? (
      small ? (
        <button type="button" className={cls} onClick={sendToPc}><Send size={16} />Send to PC</button>
      ) : (
        <button type="button" className={cls} onClick={sendToPc}>
          <Send />
          <span className="words">Send it to my PC<small>Quick Search runs on Windows</small></span>
        </button>
      )
    ) : (
      <a
        className={cls}
        href={storeUrl(where)}
        target="_blank"
        rel="noopener"
        onClick={() => qsTrack("qs_store_click", { where, platform })}
      >
        <Windows size={small ? 16 : 24} />
        {small ? "Download free" : (<span className="words">Download free<small>from the Microsoft Store</small></span>)}
      </a>
    );

  return (
    <>
      {button}
      {showNote && !small && platform === "other" && (
        <p className="qs-cta-note">Quick Search runs on Windows 10 and 11. On a Mac? <button type="button" onClick={sendToPc}>Send the link to your PC</button></p>
      )}
      {showNote && !small && platform === "phone" && (
        <p className="qs-cta-note">Or open <b>search.tubelight.net</b> on your PC.</p>
      )}
      {toast && <div className="qs-toast" role="status">{toast}</div>}
    </>
  );
}

/** Wires the static demo markup in the hero. */
export function DemoMount({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    let tried = false;
    return mountDemo(ref.current, (how) => {
      if (!tried) { tried = true; qsTrack("qs_demo_try", { how }); }
    });
  }, []);
  return (
    <div ref={ref} className="qs-demo" data-state="answer" data-pic="egg">
      {children}
    </div>
  );
}

/** The 48-second film. Poster first; the phone gets the tall cut. */
export function Film() {
  const [src, setSrc] = useState("");
  const [poster, setPoster] = useState("/search/film-poster.jpg");
  function play() {
    const tall = window.matchMedia("(max-width: 640px)").matches;
    setPoster(tall ? "/search/film-poster-phone.jpg" : "/search/film-poster.jpg");
    setSrc(tall ? "/search/stop-opening-tabs-phone.mp4" : "/search/stop-opening-tabs.mp4");
    qsTrack("qs_film_play", { tall });
  }
  return (
    <div className="qs-video" id="film">
      {src ? (
        <video src={src} poster={poster} controls autoPlay playsInline preload="auto" />
      ) : (
        <>
          <picture>
            <source media="(max-width: 640px)" srcSet="/search/film-poster-phone.jpg" />
            <img src="/search/film-poster.jpg" alt="A still from the film: Stop opening new tabs, with Quick Search answering how long to boil an egg." loading="lazy" />
          </picture>
          <button type="button" className="play" onClick={play} aria-label="Play the 48-second film with sound">
            <span className="disc"><Play size={34} /></span>
            <span className="lbl">Play · 0:48</span>
          </button>
        </>
      )}
    </div>
  );
}
