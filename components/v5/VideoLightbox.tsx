"use client";

import { useEffect, useRef, useState } from "react";
import type { VideoInfo } from "@/lib/video-paths";
import { cueAt, mmss, registerPauser, trapTab } from "./media";

export function VideoLightbox({ video, onClose }: { video: VideoInfo; onClose: () => void }) {
  const box = useRef<HTMLDivElement | null>(null);
  const vid = useRef<HTMLVideoElement | null>(null);
  const [t, setT] = useState(0);

  useEffect(() => {
    const off = registerPauser("lightbox", () => vid.current?.pause());
    const id = setTimeout(() => {
      try {
        box.current?.focus({ preventScroll: true });
        if (vid.current) {
          vid.current.muted = false;
          vid.current.play().catch(() => {});
        }
      } catch {
        /* ignore */
      }
    }, 60);
    return () => {
      clearTimeout(id);
      off();
      try {
        vid.current?.pause();
      } catch {
        /* ignore */
      }
    };
  }, []);

  return (
    <div
      className="ovl dark"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="lbox"
        role="dialog"
        aria-modal="true"
        aria-labelledby="lb-title"
        tabIndex={-1}
        ref={box}
        onKeyDown={(e) => {
          if (e.key === "Escape") onClose();
          else trapTab(e);
        }}
      >
        <div className="lhead">
          <span style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
            <span style={{ fontSize: 13, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.7)" }}>
              Made by Tubelight · {mmss(video.duration)}
            </span>
            <span id="lb-title" className="disp" style={{ fontSize: "clamp(20px, 2.4vw, 28px)", fontWeight: 600, letterSpacing: "-0.02em", lineHeight: 1.2 }}>
              {video.title}
            </span>
          </span>
          <button type="button" className="xbtn" aria-label="Close video" onClick={onClose}>
            <svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18" /></svg>
          </button>
        </div>
        <video
          ref={vid}
          src={video.src}
          poster={video.poster}
          controls
          autoPlay
          playsInline
          onTimeUpdate={(e) => setT(e.currentTarget.currentTime)}
          aria-label={video.title}
        />
        <p className="lcap" aria-live="polite">{cueAt(video.cues, t) || " "}</p>
      </div>
    </div>
  );
}
