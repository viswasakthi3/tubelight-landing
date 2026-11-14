"use client";

import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import {
  initialPreviewState,
  previewStageText,
  reducePreview,
  startPreview,
  type PreviewErrorCode,
  type PreviewEvent,
  type PreviewState,
} from "@/lib/preview-stream";
import { track } from "@/lib/track";
import type { VideoInfo, VideoMap } from "@/lib/video-paths";
import { chunkAt, chunkSay, wrap2 } from "./captions";
import { cueAt, mmss, registerPauser, trapTab } from "./media";
import { Pointer } from "./Pointer";
import { Seek } from "./Seek";
import { SignupForm } from "./SignupForm";
import { useParts } from "./useParts";
import { useWaitlist } from "./WaitlistContext";

export type PlayerSource = { kind: "video"; slug: string; t: number } | { kind: "live"; topic: string };

const IC_PLAY = "M8 5.5v13l10.5-6.5z";
const IC_PAUSE = "M7 5h3.5v14H7zM13.5 5H17v14h-3.5z";
const IC_MAX = "M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7";
const IC_MIN = "M4 14h6v6M20 10h-6V4M14 10l7-7M3 21l7-7";
const IC_SPARK = "M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9zM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z";
const IC_SOUND_ON = "M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14";
const IC_SOUND_OFF = "M16 9l5 6M21 9l-5 6";

const FOOT_VIDEO = "Unedited output from the Windows app.  Space play/pause · ← → pictures · C captions · F full screen";
const FOOT_LIVE = "Your topic is sent to our servers to make the video. It’s made by AI — if something looks off, ask a follow-up in the app.";

export default function Player({ source, videos, onClose }: { source: PlayerSource; videos: VideoMap; onClose: () => void }) {
  if (source.kind === "video") {
    const video = videos[source.slug];
    return video ? <VideoPlayer video={video} t0={source.t} onClose={onClose} /> : null;
  }
  return <LivePlayer topic={source.topic} onClose={onClose} />;
}

/* ---------- shared chrome: full screen, captions, sound ---------- */

function useChrome() {
  const box = useRef<HTMLDivElement | null>(null);
  const [max, setMax] = useState(false);
  const maxRef = useRef(false);
  const [cc, setCc] = useState(true);
  const [muted, setMuted] = useState(false);

  // Move focus into the player when it opens.
  useEffect(() => {
    const id = setTimeout(() => box.current?.focus({ preventScroll: true }), 60);
    return () => clearTimeout(id);
  }, []);

  // Real full screen can end without us (the Esc key): keep the class in step.
  useEffect(() => {
    const onChange = () => {
      if (!document.fullscreenElement) {
        maxRef.current = false;
        setMax(false);
      }
    };
    document.addEventListener("fullscreenchange", onChange);
    return () => {
      document.removeEventListener("fullscreenchange", onChange);
      try {
        if (document.fullscreenElement) void document.exitFullscreen();
      } catch {
        /* ignore */
      }
    };
  }, []);

  const toggleMax = useCallback(() => {
    const on = !maxRef.current;
    maxRef.current = on;
    setMax(on);
    try {
      if (on) {
        track("player_fullscreen");
        // Full screen where the browser allows it; the .max class alone is the fallback.
        box.current?.requestFullscreen?.().catch(() => {});
      } else if (document.fullscreenElement) {
        void document.exitFullscreen();
      }
    } catch {
      /* ignore */
    }
  }, []);

  return { box, max, cc, muted, setCc, setMuted, toggleMax };
}
type Chrome = ReturnType<typeof useChrome>;

/* ---------- the frame: head, stage, transport, slide rail ---------- */

type Slide = {
  key: string;
  num: number;
  thumb: string | null;
  mark: "none" | "ready" | "wait" | "fail";
  title: string;
  sub: string;
  on: boolean;
  speaking: boolean;
  wait: boolean;
  disabled: boolean;
  aria: string;
  pick: () => void;
};

type FrameProps = {
  chrome: Chrome;
  onClose: () => void;
  title: string;
  run?: string;
  making?: string;
  made?: string;
  stage: React.ReactNode;
  /** a form or message fills the stage: give it room on a narrow screen */
  tall?: boolean;
  canSeek: boolean;
  time: number;
  duration: number;
  onSeek: (t: number) => void;
  playing: boolean;
  onToggle: () => void;
  onPrev: () => void;
  onNext: () => void;
  onBack: () => void;
  num: string;
  clock: string;
  slides: Slide[];
  badge: string;
  empty?: string;
  foot: string;
};

const CHECK = <path d="m5 12 5 5 9-10" />;

function PlayerFrame(p: FrameProps) {
  const { chrome, onClose } = p;
  const list = useRef<HTMLDivElement | null>(null);
  const label = p.playing ? "Pause" : "Play";

  // Keep the current picture's card in view as the video moves on.
  const railKey = (p.slides.find((s) => s.on)?.key ?? "") + "|" + p.slides.length;
  useEffect(() => {
    const L = list.current;
    const el = L?.querySelector<HTMLElement>(".pl-card.on");
    if (!L || !el) return;
    const lr = L.getBoundingClientRect();
    const er = el.getBoundingClientRect();
    if (er.top < lr.top) L.scrollTop -= lr.top - er.top;
    else if (er.bottom > lr.bottom) L.scrollTop += er.bottom - lr.bottom;
    if (er.left < lr.left) L.scrollLeft -= lr.left - er.left;
    else if (er.right > lr.right) L.scrollLeft += er.right - lr.right;
  }, [railKey]);

  const handleKey = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const tag = (e.target as HTMLElement).tagName;
    if (tag === "INPUT" || tag === "TEXTAREA") {
      if (e.key === "Escape") onClose();
      return;
    }
    if (e.key === "Escape") {
      if (chrome.max) chrome.toggleMax();
      else onClose();
    } else if (e.key === " " && tag !== "BUTTON") {
      e.preventDefault();
      p.onToggle();
    } else if (e.key === "ArrowRight") p.onNext();
    else if (e.key === "ArrowLeft") p.onBack();
    else if (e.key === "c" || e.key === "C") chrome.setCc((v) => !v);
    else if (e.key === "f" || e.key === "F") chrome.toggleMax();
    else trapTab(e);
  };

  return (
    <div
      className={"ovl dark pl-ovl" + (chrome.max ? " maxed" : "")}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={"pl" + (chrome.max ? " max" : "")}
        role="dialog"
        aria-modal="true"
        aria-labelledby="pl-title"
        tabIndex={-1}
        ref={chrome.box}
        onKeyDown={handleKey}
      >
        <div className="pl-head">
          <span id="pl-title" className="pl-title">{p.title}</span>
          {p.run ? <span className="pl-time">{p.run}</span> : null}
          {p.making ? (
            <span className="pl-making"><span className="spin" aria-hidden="true" />{p.making}</span>
          ) : null}
          {p.made ? (
            <span className="pl-made">
              <svg viewBox="0 0 24 24" aria-hidden="true">{CHECK}</svg>
              {p.made}
            </span>
          ) : null}
          <button type="button" className="pl-x" aria-label="Close player" onClick={onClose}>
            <svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18" /></svg>
          </button>
        </div>
        <div className="pl-row">
          <div className="pl-stage">
            <div className={"pl-frame" + (p.tall ? " tall" : "")}>{p.stage}</div>
            <div className="pl-bar">
              <Seek tone="pl" time={p.time} duration={p.duration} disabled={!p.canSeek} onSeek={p.onSeek} />
              <div className="pl-ctrl">
                <div className="pl-grp">
                  <button type="button" className="pb fillic" aria-label={label} disabled={!p.canSeek} onClick={p.onToggle}>
                    <svg viewBox="0 0 24 24"><path d={p.playing ? IC_PAUSE : IC_PLAY} /></svg>
                    <span className="hide-xs">{label}</span>
                  </button>
                  <button type="button" className="pb" aria-label="Previous picture" disabled={!p.canSeek} onClick={p.onPrev}>
                    <svg viewBox="0 0 24 24"><path d="m15 18-6-6 6-6" /></svg>
                  </button>
                  <span className="pl-sn">{p.num}</span>
                  <button type="button" className="pb" aria-label="Next picture" disabled={!p.canSeek} onClick={p.onNext}>
                    <svg viewBox="0 0 24 24"><path d="m9 18 6-6-6-6" /></svg>
                  </button>
                  <span className="pl-tm">{p.clock}</span>
                </div>
                <div className="pl-grp">
                  <button
                    type="button"
                    className="pb"
                    aria-label={chrome.muted ? "Sound off — turn on" : "Sound on — turn off"}
                    onClick={() => chrome.setMuted((m) => !m)}
                  >
                    <svg viewBox="0 0 24 24">
                      <path d="M11 5 6 9H2v6h4l5 4z" />
                      <path d={chrome.muted ? IC_SOUND_OFF : IC_SOUND_ON} />
                    </svg>
                  </button>
                  <button type="button" className={"pb cc" + (chrome.cc ? " on" : "")} aria-pressed={chrome.cc} aria-label="Captions" onClick={() => chrome.setCc((v) => !v)}>
                    <span>CC</span>
                  </button>
                  <button
                    type="button"
                    className="pb"
                    aria-label={chrome.max ? "Exit full screen" : "Full screen"}
                    title={chrome.max ? "Exit full screen" : "Full screen"}
                    onClick={chrome.toggleMax}
                  >
                    <svg viewBox="0 0 24 24"><path d={chrome.max ? IC_MIN : IC_MAX} /></svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="pl-rail">
            <div className="pl-rail-h"><span>Slides</span><small>{p.badge}</small></div>
            <div className="pl-list" ref={list}>
              {p.slides.length === 0 && p.empty ? <p className="pl-empty">{p.empty}</p> : null}
              {p.slides.map((s) => (
                <button
                  key={s.key}
                  type="button"
                  className={"pl-card" + (s.on ? " on" : "") + (s.wait ? " wait" : "")}
                  aria-current={s.on ? "true" : undefined}
                  aria-label={s.aria}
                  disabled={s.disabled}
                  onClick={s.pick}
                >
                  <span className="pl-thumb">
                    {s.thumb ? <img src={s.thumb} alt="" /> : null}
                    {s.mark === "ready" ? (
                      <span className="pl-ready" aria-hidden="true"><svg viewBox="0 0 24 24">{CHECK}</svg></span>
                    ) : null}
                    {s.mark === "wait" ? <span className="spin" aria-hidden="true" /> : null}
                    {s.mark === "fail" ? (
                      <span className="pl-ready fail" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 8v5M12 16.5v.5" /></svg></span>
                    ) : null}
                    <span className="pl-num">{s.num}</span>
                  </span>
                  <span className="pl-ct">
                    {s.title}
                    {s.speaking ? <span className="pl-wave" aria-hidden="true"><i /><i /><i /></span> : null}
                  </span>
                  <span className="pl-cs">{s.sub}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
        <p className="pl-foot">{p.foot}</p>
      </div>
    </div>
  );
}

function Captions({ lines }: { lines: string[] }) {
  if (!lines.length) return null;
  return (
    <div className="pl-cc" aria-hidden="true">
      {lines.map((l, i) => (
        <span key={i}><b>{l}</b></span>
      ))}
    </div>
  );
}

function Cover({ children, start }: { children: React.ReactNode; start?: boolean }) {
  return (
    <div className="pl-cover">
      <div className="gate fade" style={start ? { alignItems: "flex-start" } : undefined}>{children}</div>
    </div>
  );
}

const coverTitle: React.CSSProperties = { margin: 0, fontSize: 22, lineHeight: 1.2, fontWeight: 600, letterSpacing: "-0.02em" };

function EndCard({ title, body, cta, onCta, onAgain }: { title: string; body: string; cta: string; onCta: () => void; onAgain: () => void }) {
  return (
    <Cover start>
      <p className="disp" style={coverTitle}>{title}</p>
      <p style={{ margin: 0, color: "#57536E" }}>{body}</p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
        <button type="button" className="btn" onClick={onCta}>{cta}</button>
        <button type="button" className="btn ghost" onClick={onAgain}>Watch again</button>
      </div>
    </Cover>
  );
}

/* ---------- a ready-made video ---------- */

function VideoPlayer({ video, t0, onClose }: { video: VideoInfo; t0: number; onClose: () => void }) {
  const chrome = useChrome();
  const w = useWaitlist();
  const vid = useRef<HTMLVideoElement | null>(null);
  const seeded = useRef(false);
  const [t, setT] = useState(t0);
  const [paused, setPaused] = useState(true);
  const [ended, setEnded] = useState(false);
  const { muted } = chrome;
  const sheets = video.sheets;
  const dur = video.duration;

  useEffect(() => {
    const off = registerPauser("player", () => vid.current?.pause());
    const id = setTimeout(() => {
      const el = vid.current;
      if (!el) return;
      try {
        el.muted = false;
        el.play().catch(() => {});
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

  useEffect(() => {
    if (vid.current) vid.current.muted = muted;
  }, [muted]);

  let cur = 0;
  for (let k = 0; k < sheets.length; k++) if (t + 0.05 >= sheets[k].start) cur = k;

  const seekTo = (s: number) => {
    const el = vid.current;
    if (el) {
      try {
        el.currentTime = Math.max(0, s);
        if (el.paused) el.play().catch(() => {});
      } catch {
        /* ignore */
      }
    }
    setT(s);
    setEnded(false);
  };
  const toggle = () => {
    const el = vid.current;
    if (!el) return;
    try {
      if (el.paused) el.play().catch(() => {});
      else el.pause();
    } catch {
      /* ignore */
    }
  };
  const prev = () => {
    if (!sheets.length) return;
    seekTo(t - sheets[cur].start > 2 ? sheets[cur].start : sheets[Math.max(0, cur - 1)].start);
  };
  const next = () => {
    if (cur + 1 < sheets.length) seekTo(sheets[cur + 1].start);
  };
  const back = () => {
    if (sheets.length) seekTo(sheets[Math.max(0, cur - 1)].start);
  };

  const slides: Slide[] = sheets.map((sh, i) => {
    const on = i === cur;
    return {
      key: "s" + i,
      num: i + 1,
      thumb: sh.thumb,
      mark: "none",
      title: sh.title || "Picture " + (i + 1),
      sub: mmss(sh.start),
      on,
      speaking: on && !paused,
      wait: false,
      disabled: false,
      aria: "Picture " + (i + 1) + (sh.title ? ": " + sh.title : "") + ", starts at " + mmss(sh.start),
      pick: () => seekTo(sh.start),
    };
  });

  const lines = chrome.cc && !ended ? wrap2(cueAt(video.cues, t)) : [];

  const stage = (
    <>
      <video
        ref={vid}
        src={video.src}
        poster={video.poster}
        playsInline
        preload="auto"
        onClick={toggle}
        onLoadedMetadata={(e) => {
          if (t0 > 0 && !seeded.current) {
            seeded.current = true;
            try {
              e.currentTarget.currentTime = t0;
            } catch {
              /* ignore */
            }
          }
        }}
        onTimeUpdate={(e) => setT(e.currentTarget.currentTime)}
        onPlay={() => {
          setPaused(false);
          setEnded(false);
        }}
        onPause={() => setPaused(true)}
        onEnded={() => {
          setPaused(true);
          setEnded(true);
        }}
        aria-label={video.title}
      />
      <Pointer video={vid} t={t} playing={!paused && !ended} beats={video.beats} sheets={video.sheets} />
      <Captions lines={lines} />
      {ended ? (
        <EndCard
          title="Want to make your own?"
          body="Join the waitlist, or type any topic in the search box and Tubelight makes a free preview for you."
          cta={w.sent ? "Move up the line" : "Join the waitlist"}
          onCta={() => {
            w.openModal();
            onClose();
          }}
          onAgain={() => seekTo(0)}
        />
      ) : null}
    </>
  );

  return (
    <PlayerFrame
      chrome={chrome}
      onClose={onClose}
      title={video.title}
      run={mmss(dur)}
      made="Made by Tubelight"
      stage={stage}
      tall={ended}
      canSeek
      time={t}
      duration={dur}
      onSeek={seekTo}
      playing={!paused}
      onToggle={toggle}
      onPrev={prev}
      onNext={next}
      onBack={back}
      num={sheets.length ? cur + 1 + " / " + sheets.length : "– / –"}
      clock={mmss(t) + " / " + mmss(dur)}
      slides={slides}
      badge={sheets.length + " slides"}
      foot={FOOT_VIDEO}
    />
  );
}

/* ---------- a live preview, made for the visitor's topic ---------- */

type LiveAction = PreviewEvent | "reset";
const liveReducer = (s: PreviewState, a: LiveAction) => (a === "reset" ? initialPreviewState : reducePreview(s, a));

const short = (s: string) => (s.length > 80 ? s.slice(0, 79) + "…" : s);

function errorCopy(code: PreviewErrorCode, topic: string, joined: boolean): { text: string; form: boolean; retry: boolean } {
  const saved = `“${short(topic)}”`;
  switch (code) {
    case "limit_ip":
      return joined
        ? { text: "You’ve used today’s free preview. Come back tomorrow for another — you’re already on the waitlist.", form: false, retry: false }
        : { text: `You’ve used today’s free preview. Join the waitlist and we’ll save ${saved} with your spot.`, form: true, retry: false };
    case "limit_day":
    case "busy":
      return { text: "Lots of people are trying Tubelight right now. Try again in a minute.", form: false, retry: true };
    case "disabled":
      return joined
        ? { text: "Live previews are paused right now. You’re already on the waitlist, so you won’t miss your invite.", form: false, retry: false }
        : { text: `Live previews are paused right now. Join the waitlist and we’ll save ${saved} with your spot.`, form: true, retry: false };
    case "bad_topic":
      return { text: "Try a shorter topic — a few words or a question.", form: false, retry: false };
    case "network":
      return { text: "The connection dropped.", form: false, retry: true };
  }
}

function LivePlayer({ topic, onClose }: { topic: string; onClose: () => void }) {
  const chrome = useChrome();
  const w = useWaitlist();
  const [st, dispatch] = useReducer(liveReducer, initialPreviewState);
  const [attempt, setAttempt] = useState(0);
  const startedAt = useRef(0);
  const { muted } = chrome;

  // Stream the preview; leaving (or retrying) aborts it.
  useEffect(() => {
    dispatch("reset");
    const ac = new AbortController();
    // Deferred a tick so React's dev double-mount cannot send the topic twice.
    const id = setTimeout(() => {
      startedAt.current = performance.now();
      track("preview_start");
      void startPreview(topic, dispatch, ac.signal);
    }, 0);
    return () => {
      clearTimeout(id);
      ac.abort();
    };
  }, [topic, attempt]);

  useEffect(() => {
    if (st.status === "ready") track("preview_ready", { ms: Math.round(performance.now() - startedAt.current) });
    else if (st.status === "error" && st.error) track("preview_error", { code: st.error });
  }, [st.status, st.error]);

  const errored = st.status === "error";
  const ready = st.status === "ready";
  const enabled = ready && w.sent;
  const parts = useParts({ beats: st.beats, voices: st.voices, enabled, muted });
  const { cur, ended, blocked, starts, durs, total, time } = parts;

  const pausePlayer = parts.pause;
  useEffect(() => registerPauser("player", pausePlayer), [pausePlayer]);

  const sheets = st.sheets;
  const sheetOf = (i: number) => Math.min(Math.max(st.beats[i]?.sheet ?? 0, 0), Math.max(sheets.length - 1, 0));
  const curSheet = enabled ? sheetOf(cur) : -1;
  // When each picture's first beat starts on the timeline of voice clips (null: no beat uses it).
  const sheetStart = sheets.map((_, s) => {
    const i = st.beats.findIndex((_, k) => sheetOf(k) === s);
    return i >= 0 ? (starts[i] ?? 0) : null;
  });

  const seekSheet = (s: number) => {
    const at = sheetStart[s];
    if (at !== null && at !== undefined) parts.seek(at);
  };
  const stepSheet = (dir: 1 | -1, restart: boolean) => {
    if (curSheet < 0) return;
    const open = sheets.map((_, s) => s).filter((s) => sheetStart[s] !== null);
    const at = open.indexOf(curSheet);
    if (restart && dir === -1 && time - (sheetStart[curSheet] ?? 0) > 2) return seekSheet(curSheet);
    const target = open[Math.min(open.length - 1, Math.max(0, at + dir))];
    if (target !== undefined) seekSheet(target);
  };

  const slides: Slide[] = sheets.map((sh, i) => {
    const img = st.images[i];
    const failed = st.imageFailed[i] || (!img && enabled);
    const first = st.images.findIndex((x, k) => x === null && !st.imageFailed[k]);
    const sub = enabled
      ? sheetStart[i] === null ? "No narration" : mmss(sheetStart[i] ?? 0)
      : img ? "Drawn" : failed ? "Couldn’t be drawn" : i === first && st.status !== "starting" ? "Being drawn…" : "Queued";
    const on = i === curSheet;
    return {
      key: "p" + i,
      num: i + 1,
      thumb: img,
      mark: img ? "none" : failed ? "fail" : "wait",
      title: sh.title || "Picture " + (i + 1),
      sub,
      on,
      speaking: on && parts.playing,
      wait: !img && !failed,
      disabled: !enabled || sheetStart[i] === null,
      aria: "Picture " + (i + 1) + (sh.title ? ": " + sh.title : "") + ", " + (enabled ? "starts at " + mmss(sheetStart[i] ?? 0) : img ? "drawn" : failed ? "could not be drawn" : "not ready yet"),
      pick: () => seekSheet(i),
    };
  });

  // The caption: the beat's words in pieces of two lines, in proportion to how much of the clip has played.
  const chunks = useMemo(() => chunkSay(st.beats[cur]?.say ?? ""), [st.beats, cur]);
  const frac = durs[cur] ? parts.pos / durs[cur] : 0;
  const lines = enabled && chrome.cc && !ended ? wrap2(chunkAt(chunks, frac)) : [];

  const joinedCb = () => track("preview_gate_submit");
  const retry = () => setAttempt((a) => a + 1);

  let stage: React.ReactNode;
  let tall = true;
  if (errored) {
    const copy = errorCopy(st.error ?? "network", topic, w.sent);
    stage = (
      <div className="pl-msg" role="alert">
        <p className="disp" style={{ fontSize: 22, lineHeight: 1.25, fontWeight: 600, letterSpacing: "-0.02em", color: "#221E3F", textWrap: "balance" }}>{copy.text}</p>
        {copy.form ? (
          <>
            <SignupForm id="em-gate" placement="preview" label="Join the waitlist" topic={topic} quiet onJoined={joinedCb} />
            <p className="micro">We’ll only email you about your invite.</p>
          </>
        ) : null}
        {copy.retry ? <button type="button" className="btn" onClick={retry}>Retry</button> : null}
      </div>
    );
  } else if (enabled) {
    tall = ended || blocked;
    stage = (
      <>
        <div className="pl-pics" onClick={parts.toggle}>
          {sheets.map((sh, i) =>
            st.images[i] ? <img key={i} className={"pl-img" + (i === curSheet ? " on" : "")} src={st.images[i] ?? ""} alt={sh.title} aria-hidden={i !== curSheet} /> : null,
          )}
          {curSheet >= 0 && !st.images[curSheet] ? (
            <p className="pl-empty">This picture could not be drawn.</p>
          ) : null}
        </div>
        <Captions lines={lines} />
        <audio ref={parts.audioRef} {...parts.audioProps} />
        {ended ? (
          <EndCard
            title="That’s your first Tubelight video."
            body="Want an earlier invite? Tell us how you’ll use Tubelight — every answer moves you up the line."
            cta="Move up the line"
            onCta={() => {
              w.openModal();
              onClose();
            }}
            onAgain={() => parts.seek(0)}
          />
        ) : blocked ? (
          <Cover start>
            <p className="disp" style={coverTitle}>Your video is ready.</p>
            <p style={{ margin: 0, color: "#57536E" }}>Press play to watch it with sound.</p>
            <button type="button" className="btn" onClick={parts.toggle}>Play my video</button>
          </Cover>
        ) : null}
      </>
    );
  } else {
    stage = (
      <>
        <div className="pl-making-stage">
          <span className="sg-ic" aria-hidden="true" style={{ width: 52, height: 52, borderRadius: 16, background: "linear-gradient(135deg, #7A5CFA, #5B8CFF)", color: "#FFFFFF" }}>
            <svg viewBox="0 0 24 24" style={{ width: 24, height: 24, fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinejoin: "round" }}><path d={IC_SPARK} /></svg>
          </span>
          <p className="disp" style={{ margin: 0 }}>“{short(topic)}”</p>
          <span className="stage-line" role="status">
            {ready ? null : <span className="spin" aria-hidden="true" />}
            {previewStageText(st)}
          </span>
        </div>
        {!w.sent ? (
          <Cover>
            <p className="disp" style={coverTitle}>{ready ? "Your video is ready." : "Your video is being made."}</p>
            <p style={{ margin: 0, color: "#57536E" }}>
              {ready ? "Enter your email to watch it." : "Enter your email to watch it when it’s ready — usually about 20 seconds."}
            </p>
            <SignupForm id="em-gate" placement="preview" label="Watch my video" topic={topic} quiet onJoined={joinedCb} />
            <p className="micro">This also puts you on the Tubelight waitlist. We’ll only email you about your invite.</p>
          </Cover>
        ) : null}
      </>
    );
  }

  const n = sheets.length;
  const made = enabled ? "Made just now" : undefined;
  const makingPill = !errored && !ready ? previewStageText(st) : undefined;

  return (
    <PlayerFrame
      chrome={chrome}
      onClose={onClose}
      title={errored ? "Free preview" : st.title || "Making your video…"}
      run={enabled ? mmss(total) : undefined}
      making={makingPill}
      made={made}
      stage={stage}
      tall={tall}
      canSeek={enabled}
      time={time}
      duration={enabled ? total : 0}
      onSeek={(x) => parts.seek(x)}
      playing={parts.playing}
      onToggle={parts.toggle}
      onPrev={() => stepSheet(-1, true)}
      onNext={() => stepSheet(1, false)}
      onBack={() => stepSheet(-1, false)}
      num={enabled && n ? curSheet + 1 + " / " + n : n ? "– / " + n : "–"}
      clock={enabled ? mmss(time) + " / " + mmss(total) : "0:00 / –"}
      slides={slides}
      badge={enabled ? n + " slides" : n ? st.images.filter(Boolean).length + " of " + n + " ready" : "Planning…"}
      empty="Pictures appear here as they’re drawn."
      foot={FOOT_LIVE}
    />
  );
}
