"use client";

import { useRef, useState } from "react";
import { mmss } from "./media";

/**
 * One seekable timeline for the hero and the big player (v5.4, 8.1).
 * Click or drag to scrub, arrow keys 5 s, PageUp/PageDown 10 s, Home/End.
 * Its own keys never reach the parent (the big player uses ←/→ for slides).
 */
export function Seek({
  time,
  duration,
  onSeek,
  disabled,
  tone,
}: {
  time: number;
  duration: number;
  onSeek: (t: number) => void;
  disabled?: boolean;
  tone?: "pl";
}) {
  const drag = useRef(false);
  const [dragging, setDragging] = useState(false);
  const off = !!disabled || !duration;
  const pct = duration ? Math.min(100, Math.max(0, Math.round((time / duration) * 1000) / 10)) : 0;

  const at = (e: React.PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const f = r.width ? Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)) : 0;
    onSeek(f * duration);
  };

  return (
    <div
      className={"seek" + (tone ? " " + tone : "") + (dragging ? " drag" : "")}
      role="slider"
      tabIndex={off ? -1 : 0}
      aria-label="Seek"
      aria-valuemin={0}
      aria-valuemax={Math.round(duration)}
      aria-valuenow={Math.round(time)}
      aria-valuetext={mmss(time) + " of " + mmss(duration)}
      aria-disabled={off || undefined}
      onPointerDown={(e) => {
        if (off) return;
        try {
          e.currentTarget.setPointerCapture(e.pointerId);
        } catch {
          /* ignore */
        }
        drag.current = true;
        setDragging(true);
        at(e);
      }}
      onPointerMove={(e) => {
        if (drag.current && !off) at(e);
      }}
      onPointerUp={(e) => {
        if (!drag.current) return;
        drag.current = false;
        setDragging(false);
        try {
          e.currentTarget.releasePointerCapture(e.pointerId);
        } catch {
          /* ignore */
        }
      }}
      onPointerCancel={(e) => {
        if (!drag.current) return;
        drag.current = false;
        setDragging(false);
        try {
          e.currentTarget.releasePointerCapture(e.pointerId);
        } catch {
          /* ignore */
        }
      }}
      onKeyDown={(e) => {
        if (off || e.ctrlKey || e.metaKey || e.altKey) return;
        let t: number | null = null;
        if (e.key === "ArrowRight") t = time + 5;
        else if (e.key === "ArrowLeft") t = time - 5;
        else if (e.key === "PageUp") t = time + 10;
        else if (e.key === "PageDown") t = time - 10;
        else if (e.key === "Home") t = 0;
        else if (e.key === "End") t = duration;
        if (t === null) return;
        e.preventDefault();
        e.stopPropagation();
        onSeek(Math.max(0, Math.min(duration, t)));
      }}
    >
      <span className="seek-track">
        <span className="seek-fill" style={{ width: pct + "%" }} />
      </span>
      <span className="seek-knob" aria-hidden="true" style={{ left: pct + "%" }} />
    </div>
  );
}
