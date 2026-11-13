"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { PreviewBeat } from "@/lib/preview-stream";
import { estimateSeconds } from "./captions";

/** The pause between two voice clips, the same as the app's queue player. */
export const GAP_MS = 140;

type Args = {
  beats: PreviewBeat[];
  /** a voice clip (a data URL) per beat, or null when that clip is missing */
  voices: (string | null)[];
  /** playback starts the first time this turns true */
  enabled: boolean;
  muted: boolean;
};

/**
 * Plays a live preview's parts: each beat's voice clip in order through one <audio> element, with a
 * short gap between clips. The timeline is the clips laid end to end (durations are measured from
 * the clips themselves). A beat without a clip is "played" silently for an estimated time so its
 * caption still shows.
 */
export function useParts({ beats, voices, enabled, muted }: Args) {
  const n = beats.length;
  const [cur, setCur] = useState(0);
  const [pos, setPos] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [ended, setEnded] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [measured, setMeasured] = useState<(number | undefined)[]>([]);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const curRef = useRef(0);
  const posRef = useRef(0);
  const playingRef = useRef(false);
  const startedRef = useRef(false);
  const loadedRef = useRef(-1); // which beat's clip the <audio> element holds
  const gapRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const tickRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  const durs = useMemo(
    () => beats.map((b, i) => (voices[i] ? (measured[i] ?? estimateSeconds(b.say)) : estimateSeconds(b.say))),
    [beats, voices, measured],
  );
  const starts = useMemo(() => {
    let acc = 0;
    return durs.map((d) => {
      const s = acc;
      acc += d;
      return s;
    });
  }, [durs]);
  const total = durs.reduce((a, b) => a + b, 0);

  // Everything the timers and media events call lives here, so they always see the latest values.
  const live = useRef({ durs, voices, muted, n });
  live.current = { durs, voices, muted, n };
  const fn = useRef({
    play: (_i: number, _offset: number) => {},
    finish: (_i: number) => {},
  });

  const setPosBoth = (p: number) => {
    posRef.current = p;
    setPos(p);
  };
  const clearTimers = () => {
    clearTimeout(gapRef.current);
    clearInterval(tickRef.current);
  };

  fn.current.finish = (i: number) => {
    clearTimers();
    const { durs: d, n: count } = live.current;
    setPosBoth(d[i] ?? posRef.current);
    if (i + 1 < count) {
      gapRef.current = setTimeout(() => fn.current.play(i + 1, 0), GAP_MS);
    } else {
      playingRef.current = false;
      setPlaying(false);
      setEnded(true);
    }
  };

  fn.current.play = (i: number, offset: number) => {
    const { voices: v, durs: d, muted: m, n: count } = live.current;
    if (i < 0 || i >= count) return;
    clearTimers();
    curRef.current = i;
    setCur(i);
    setPosBoth(offset);
    setEnded(false);
    setBlocked(false);
    playingRef.current = true;
    setPlaying(true);
    const a = audioRef.current;
    const src = v[i];
    if (src && a) {
      if (loadedRef.current !== i) {
        loadedRef.current = i;
        a.src = src;
      }
      a.muted = m;
      try {
        a.currentTime = offset;
      } catch {
        /* metadata not in yet; the clip starts from the top */
      }
      const p = a.play();
      if (p && p.catch) {
        p.catch(() => {
          // The browser wants a tap before it plays sound: wait for one.
          if (curRef.current === i && playingRef.current) {
            playingRef.current = false;
            setPlaying(false);
            setBlocked(true);
          }
        });
      }
    } else {
      try {
        a?.pause();
      } catch {
        /* ignore */
      }
      const t0 = performance.now() - offset * 1000;
      tickRef.current = setInterval(() => {
        const p = (performance.now() - t0) / 1000;
        if (p >= (d[i] ?? 0)) fn.current.finish(i);
        else setPosBoth(p);
      }, 100);
    }
  };

  const pause = useCallback(() => {
    if (!playingRef.current) return;
    playingRef.current = false;
    setPlaying(false);
    clearTimeout(gapRef.current);
    clearInterval(tickRef.current);
    try {
      audioRef.current?.pause();
    } catch {
      /* ignore */
    }
  }, []);

  const resume = useCallback(() => {
    const i = curRef.current;
    const { durs: d, n: count } = live.current;
    if (!startedRef.current) {
      startedRef.current = true;
      fn.current.play(0, 0);
    } else if (posRef.current >= (d[i] ?? 0) - 0.05) {
      if (i + 1 < count) fn.current.play(i + 1, 0);
      else fn.current.play(0, 0);
    } else fn.current.play(i, posRef.current);
  }, []);

  const toggle = useCallback(() => {
    if (playingRef.current) pause();
    else resume();
  }, [pause, resume]);

  /** Jump to `t` seconds on the timeline of clips, and play from there. */
  const seek = useCallback((t: number) => {
    const { durs: d, n: count } = live.current;
    if (!count) return;
    startedRef.current = true;
    let acc = 0;
    for (let i = 0; i < count; i++) {
      if (t < acc + d[i] || i === count - 1) {
        fn.current.play(i, Math.max(0, Math.min(t - acc, d[i])));
        return;
      }
      acc += d[i];
    }
  }, []);

  // Start once the preview is ready and the visitor is in.
  useEffect(() => {
    if (!enabled || startedRef.current || n === 0) return;
    startedRef.current = true;
    fn.current.play(0, 0);
  }, [enabled, n]);

  // Measure every clip's length, so the timeline and the seek bar are true.
  useEffect(() => {
    if (!enabled) return;
    const probes: HTMLAudioElement[] = [];
    voices.forEach((src, i) => {
      if (!src) return;
      const a = new Audio();
      a.preload = "metadata";
      a.onloadedmetadata = () => {
        if (!Number.isFinite(a.duration) || a.duration <= 0) return;
        setMeasured((m) => {
          if (m[i] === a.duration) return m;
          const next = m.slice();
          next[i] = a.duration;
          return next;
        });
      };
      a.src = src;
      probes.push(a);
    });
    return () => {
      probes.forEach((a) => {
        a.onloadedmetadata = null;
        a.removeAttribute("src");
      });
    };
  }, [enabled, voices]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.muted = muted;
  }, [muted]);

  useEffect(
    () => () => {
      clearTimeout(gapRef.current);
      clearInterval(tickRef.current);
      try {
        audioRef.current?.pause();
      } catch {
        /* ignore */
      }
    },
    [],
  );

  const audioProps = {
    preload: "auto" as const,
    onTimeUpdate: (e: React.SyntheticEvent<HTMLAudioElement>) => {
      if (playingRef.current && loadedRef.current === curRef.current) setPosBoth(e.currentTarget.currentTime);
    },
    onEnded: () => {
      if (playingRef.current) fn.current.finish(curRef.current);
    },
    onLoadedMetadata: (e: React.SyntheticEvent<HTMLAudioElement>) => {
      const d = e.currentTarget.duration;
      const i = loadedRef.current;
      if (i < 0 || !Number.isFinite(d) || d <= 0) return;
      setMeasured((m) => {
        if (m[i] === d) return m;
        const next = m.slice();
        next[i] = d;
        return next;
      });
    },
  };

  const time = ended ? total : (starts[cur] ?? 0) + Math.min(pos, durs[cur] ?? 0);

  return { cur, pos, playing, ended, blocked, durs, starts, total, time, audioRef, audioProps, toggle, pause, seek };
}
