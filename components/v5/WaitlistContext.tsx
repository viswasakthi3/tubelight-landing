"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { track } from "@/lib/track";
import { OTHER, QS } from "./questions";

export type Placement = "hero" | "final" | "dialog" | "preview";
export type Step = null | "email" | "q" | "done";
type Stats = { total: number; thisWeek: number; show: boolean };

export type WaitlistApi = {
  referralUrl: string;
  email: string;
  setEmail: (v: string) => void;
  err: string;
  submitting: boolean;
  sent: boolean;
  /**
   * Join the waitlist. `topic` is saved with the spot (the live preview sends the visitor's topic);
   * `quiet` skips the questions dialog, which the preview gate does not want. Resolves true when joined.
   */
  submit: (placement: Placement, opts?: { topic?: string; quiet?: boolean }) => Promise<boolean>;
  /** real place in line from the server, or null when unknown */
  position: number | null;
  /** animated number shown in the dialog */
  shown: number;
  /** spots gained by the latest answer (flashes briefly) */
  delta: number;
  moved: number;
  stats: Stats | null;
  modal: Step;
  openModal: () => void;
  closeModal: () => void;
  qi: number;
  picked: string[];
  /** @deprecated no free-text step any more; kept as a no-op so Player.tsx still compiles */
  otherText: string;
  setOtherText: (v: string) => void;
  aboutText: string;
  setAboutText: (v: string) => void;
  answerErr: string;
  pick: (label: string) => void;
  nextQ: () => void;
  skipQ: () => void;
};

const Ctx = createContext<WaitlistApi | null>(null);

export function useWaitlist(): WaitlistApi {
  const v = useContext(Ctx);
  if (!v) throw new Error("useWaitlist outside WaitlistProvider");
  return v;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function WaitlistProvider({ children }: { children: React.ReactNode }) {
  const [email, setEmailRaw] = useState("");
  const [err, setErr] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [referralUrl, setReferralUrl] = useState("");
  const [sent, setSent] = useState(false);
  const [position, setPosition] = useState<number | null>(null);
  const [shown, setShown] = useState(0);
  const [delta, setDelta] = useState(0);
  const [moved, setMoved] = useState(0);
  const [stats, setStats] = useState<Stats | null>(null);
  const [modal, setModal] = useState<Step>(null);
  const [qi, setQi] = useState(0);
  const [picked, setPickedState] = useState<string[]>([]);
  const [otherText, setOtherRaw] = useState("");
  const [aboutText, setAboutRaw] = useState("");
  const [answerErr, setAnswerErr] = useState("");

  const token = useRef("");
  const sentEmail = useRef("");
  const startPos = useRef<number | null>(null);
  const shownRef = useRef(0);
  const qiRef = useRef(0);
  const pickedRef = useRef<string[]>([]);
  const otherRef = useRef("");
  const aboutRef = useRef("");
  const timers = useRef<{ tick?: ReturnType<typeof setInterval>; nq?: ReturnType<typeof setTimeout>; dt?: ReturnType<typeof setTimeout> }>({});

  useEffect(() => {
    const t = timers.current;
    return () => {
      clearInterval(t.tick);
      clearTimeout(t.nq);
      clearTimeout(t.dt);
    };
  }, []);

  // Keep the signup response if an older stats request finishes later.
  useEffect(() => {
    let live = true;
    fetch("/api/waitlist/stats")
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (live && j && typeof j.total === "number") setStats((current) => current ?? ({ total: j.total, thisWeek: Number(j.thisWeek) || 0, show: !!j.show }));
      })
      .catch(() => undefined);
    return () => {
      live = false;
    };
  }, []);

  const setEmail = useCallback((v: string) => {
    setEmailRaw(v);
    setErr("");
  }, []);
  const setOtherText = useCallback((v: string) => {
    const t = v.slice(0, 80);
    otherRef.current = t;
    setOtherRaw(t);
  }, []);
  const setAboutText = useCallback((v: string) => {
    const t = v.slice(0, 120);
    aboutRef.current = t;
    setAboutRaw(t);
  }, []);
  const clearTexts = useCallback(() => {
    otherRef.current = "";
    aboutRef.current = "";
    setOtherRaw("");
    setAboutRaw("");
  }, []);
  const setPicked = useCallback((p: string[]) => {
    pickedRef.current = p;
    setPickedState(p);
  }, []);
  const setQiBoth = useCallback((n: number) => {
    qiRef.current = n;
    setQi(n);
  }, []);

  const tickTo = useCallback((target: number) => {
    clearInterval(timers.current.tick);
    const from = shownRef.current;
    const start = Date.now();
    const d = 700;
    timers.current.tick = setInterval(() => {
      const p = Math.min(1, (Date.now() - start) / d);
      const e = 1 - Math.pow(1 - p, 3);
      const v = Math.round(from + (target - from) * e);
      shownRef.current = v;
      setShown(v);
      if (p >= 1) clearInterval(timers.current.tick);
    }, 30);
  }, []);

  const submit = useCallback(
    async (placement: Placement, opts?: { topic?: string; quiet?: boolean }): Promise<boolean> => {
      const v = email.trim();
      if (!EMAIL_RE.test(v)) {
        setErr("That email doesn’t look quite right — mind checking it?");
        return false;
      }
      setSubmitting(true);
      setErr("");
      try {
        const searched = (opts?.topic ?? "").trim().slice(0, 120);
        const res = await fetch("/api/waitlist", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ email: v, source: "site", topic: searched, ref: new URLSearchParams(location.search).get("ref") }),
        });
        const j = await res.json().catch(() => ({}));
        if (!res.ok || !j.ok) {
          setErr(typeof j.error === "string" ? j.error : "Something went wrong. Please try again in a moment.");
          return false;
        }
        token.current = typeof j.token === "string" ? j.token : "";
        sentEmail.current = v.toLowerCase();
        const pos = typeof j.position === "number" ? j.position : null;
        startPos.current = pos;
        shownRef.current = pos ?? 0;
        setPosition(pos);
        setShown(pos ?? 0);
        setMoved(0);
        setDelta(0);
        if (typeof j.referralCode === "string") {
          const url = new URL("/", location.origin);
          url.searchParams.set("ref", j.referralCode);
          setReferralUrl(url.href);
        }
        if (typeof j.total === "number") {
          setStats((prev) => ({ total: j.total, thisWeek: prev?.thisWeek ?? 0, show: j.total > 0 }));
        }
        setSent(true);
        setPicked([]);
        setQiBoth(0);
        setAnswerErr("");
        clearTexts();
        if (!opts?.quiet) setModal("q");
        track("waitlist_submit", { placement, duplicate: !!j.duplicate });
        return true;
      } catch {
        setErr("Couldn’t reach the server. Check your connection and try again.");
        return false;
      } finally {
        setSubmitting(false);
      }
    },
    [email, setPicked, setQiBoth, clearTexts],
  );

  // A friend may have joined while the inviter was sharing in another tab.
  useEffect(() => {
    if (!sent) return;
    const refresh = async () => {
      try {
        const res = await fetch("/api/waitlist/position", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ email: sentEmail.current, token: token.current }),
        });
        if (!res.ok) return;
        const data = await res.json();
        if (typeof data.position === "number") {
          setPosition(data.position);
          tickTo(data.position);
        }
      } catch { /* Keep the last confirmed position. */ }
    };
    window.addEventListener("focus", refresh);
    return () => window.removeEventListener("focus", refresh);
  }, [sent, tickTo]);

  const openModal = useCallback(() => {
    setErr("");
    setModal(!sent ? "email" : qiRef.current >= QS.length ? "done" : "q");
  }, [sent]);
  const closeModal = useCallback(() => setModal(null), []);

  const goDone = useCallback((after: number) => {
    setTimeout(() => {
      setModal((m) => (m === "q" ? "done" : m));
      track("waitlist_done");
    }, after);
  }, []);

  const advance = useCallback(
    (value: string | string[] | null, counted: boolean) => {
      const q = qiRef.current;
      const next = q + 1;
      setPicked([]);
      clearTexts();
      setAnswerErr("");
      setQiBoth(next);
      track("waitlist_answer", { question: q, skipped: !counted });
      if (!counted) {
        if (next >= QS.length) goDone(0);
        return;
      }
      fetch("/api/waitlist/answers", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: sentEmail.current, token: token.current, question: q, answer: value }),
      })
        .then((r) => r.json().catch(() => ({})))
        .then((j) => {
          if (!j || !j.ok || typeof j.position !== "number") throw new Error("bad response");
          const prev = typeof j.previousPosition === "number" ? j.previousPosition : j.position;
          const gained = Math.max(0, prev - j.position);
          if (startPos.current === null) startPos.current = prev;
          if (shownRef.current === 0) {
            shownRef.current = prev;
            setShown(prev);
          }
          setPosition(j.position);
          setMoved(Math.max(0, (startPos.current ?? prev) - j.position));
          tickTo(j.position);
          if (gained > 0) {
            setDelta(gained);
            clearTimeout(timers.current.dt);
            timers.current.dt = setTimeout(() => setDelta(0), 1400);
          }
          if (next >= QS.length) goDone(gained > 0 ? 900 : 0);
        })
        .catch(() => {
          setAnswerErr("Couldn’t save that one — you can keep going.");
          if (next >= QS.length) goDone(0);
        });
    },
    [goDone, tickTo, setPicked, setQiBoth, clearTexts],
  );

  const pick = useCallback(
    (label: string) => {
      const q = QS[Math.min(qiRef.current, QS.length - 1)];
      if (q.multi) {
        const p = pickedRef.current.slice();
        const at = p.indexOf(label);
        if (at >= 0) p.splice(at, 1);
        else p.push(label);
        setPicked(p);
        return;
      }
      const cur = pickedRef.current;
      // A plain pick on a question that auto-advances is already on its way; ignore further taps.
      if (cur.length && cur[0] !== OTHER && !q.about) return;
      if (cur[0] === label) {
        setPicked([]);
        return;
      }
      setPicked([label]);
      clearTimeout(timers.current.nq);
      // "Other" and the optional "about" box need a Next press; everything else moves on by itself.
      if (label !== OTHER && !q.about) timers.current.nq = setTimeout(() => nextQRef.current(), 320);
    },
    [setPicked],
  );

  const nextQ = useCallback(() => {
    clearTimeout(timers.current.nq);
    const out = pickedRef.current.map((l) => {
      if (l !== OTHER) return l;
      const t = otherRef.current.trim();
      return t ? `Other: ${t}` : "Other";
    });
    const about = aboutRef.current.trim();
    if (about) out.push(`About: ${about}`);
    advance(out, true);
  }, [advance]);
  const nextQRef = useRef(nextQ);
  nextQRef.current = nextQ;

  const skipQ = useCallback(() => {
    clearTimeout(timers.current.nq);
    advance(null, false);
  }, [advance]);

  const value = useMemo<WaitlistApi>(
    () => ({ referralUrl, email, setEmail, err, submitting, sent, submit, position, shown, delta, moved, stats, modal, openModal, closeModal, qi, picked, otherText, setOtherText, aboutText, setAboutText, answerErr, pick, nextQ, skipQ }),
    [referralUrl, email, setEmail, err, submitting, sent, submit, position, shown, delta, moved, stats, modal, openModal, closeModal, qi, picked, otherText, setOtherText, aboutText, setAboutText, answerErr, pick, nextQ, skipQ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
