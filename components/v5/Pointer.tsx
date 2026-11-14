"use client";

import { useEffect, useRef, useState } from "react";
import type { Beat, Sheet } from "@/lib/video-paths";

/**
 * The app's pointer (the ring) over a video (v5.4, 8.2).
 * Sits inside the same positioned box as the <video>; it glides between the places the
 * beats point at, only while the video really plays, and only on pictures that have more
 * than one place to look at (sheet.walk). Decorative: the captions carry the meaning.
 */
export function Pointer({
  video,
  t,
  playing,
  beats,
  sheets,
}: {
  video: React.RefObject<HTMLVideoElement | null>;
  t: number;
  playing: boolean;
  beats: Beat[] | undefined;
  sheets: Sheet[] | undefined;
}) {
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [armed, setArmed] = useState(false);
  const last = useRef<{ l: number; t: number; s: number } | null>(null);

  // The picture box inside the element: re-measured whenever it resizes.
  useEffect(() => {
    const el = video.current;
    if (!el) return;
    const read = () => setSize((o) => (o.w === el.clientWidth && o.h === el.clientHeight ? o : { w: el.clientWidth, h: el.clientHeight }));
    read();
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(read);
    ro.observe(el);
    return () => ro.disconnect();
  }, [video]);

  let beat: Beat | undefined;
  if (beats) for (const b of beats) if (t >= b.start && t < b.end) beat = b;
  const sheetIdx = beat ? beat.sheet : -1;
  const sheet = beat && sheets ? sheets[beat.sheet] : undefined;

  // Armed 600 ms after the current picture started to show while playing (reset on each new picture and each play).
  useEffect(() => {
    setArmed(false);
    if (!playing) return;
    const id = setTimeout(() => setArmed(true), 600);
    return () => clearTimeout(id);
  }, [sheetIdx, playing]);

  const { w: cw, h: ch } = size;
  let boxW = cw;
  let boxH = (cw * 9) / 16;
  let bl = 0;
  let bt = 0;
  if (cw && ch) {
    if (cw / ch > 16 / 9) {
      boxH = ch;
      boxW = (ch * 16) / 9;
      bl = (cw - boxW) / 2;
    } else {
      bt = (ch - boxH) / 2;
    }
  }
  const ok = !!(cw && beat && beat.ptr && sheet && sheet.walk);
  if (ok && beat && beat.ptr && sheet) {
    last.current = {
      l: bl + beat.ptr.x * boxW,
      t: bt + beat.ptr.y * boxH,
      s: Math.max(20, Math.min(38, Math.round(0.038 * boxW))),
    };
  }
  const p = last.current ?? { l: cw / 2, t: ch / 2, s: 12 };
  const on = ok && playing && armed;

  return (
    <span
      className={"tl-spot-ring" + (on ? " is-on" : "")}
      aria-hidden="true"
      style={{ left: Math.round(p.l), top: Math.round(p.t), width: p.s, height: p.s, margin: `-${p.s / 2}px 0 0 -${p.s / 2}px` }}
    />
  );
}
