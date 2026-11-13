"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { track } from "@/lib/track";
import { QS } from "./questions";

export type Placement = "hero" | "final" | "dialog" | "preview";
export type Step = null | "email" | "q" | "done";
type Stats = { total: number; thisWeek: number; show: boolean };

export type WaitlistApi = {
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
  wish: string;
  setWish: (v: string) => void;
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
  const [sent, setSent] = useState(false);
  const [position, setPosition] = useState<number | null>(null);
  const [shown, setShown] = useState(0);
  const [delta, setDelta] = useState(0);
  const [moved, setMoved] = useState(0);
  const [stats, setStats] = useState<Stats | null>(null);
  const [modal, setModal] = useState<Step>(null);
  const [qi, setQi] = useState(0);
  const [picked, setPickedState] = useState<string[]>([]);
  const [wish, setWishRaw] = useState("");
  const [answerErr, setAnswerErr] = useState("");

  const token = useRef("");
  const sentEmail = useRef("");
  const startPos = useRef<number | null>(null);
  const shownRef = useRef(0);
  const qiRef = useRef(0);
  const pickedRef = useRef<string[]>([]);
  const timers = useRef<{ tick?: ReturnType<typeof setInterval>; nq?: ReturnType<typeof setTimeout>; dt?: ReturnType<typeof setTimeout> }>({});

  useEffect(() => {
    const t = timers.current;
    return () => {
      clearInterval(t.tick);
      clearTimeout(t.nq);
      clearTimeout(t.dt);
    };
  }, []);

  // Real numbers only: the page shows the count when the server says it is big enough.
  useEffect(() => {
    let live = true;
    fetch("/api/waitlist/stats")
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (live && j && typeof j.total === "number") setStats({ total: j.total, thisWeek: Number(j.thisWeek) || 0, show: !!j.show });
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
  const setWish = useCallback((v: string) => setWishRaw(v.slice(0, 200)), []);
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
          body: JSON.stringify(searched ? { email: v, source: "site", topic: searched } : { email: v, source: "site" }),
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
        setSent(true);
        setPicked([]);
        setQiBoth(0);
        setAnswerErr("");
        if (searched) setWishRaw(searched);
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
    [email, setPicked, setQiBoth],
  );

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
    [goDone, tickTo, setPicked, setQiBoth],
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
      if (pickedRef.current.length) return;
      setPicked([label]);
      clearTimeout(timers.current.nq);
      timers.current.nq = setTimeout(() => advance(label, true), 320);
    },
    [advance, setPicked],
  );

  const nextQ = useCallback(() => {
    const q = QS[Math.min(qiRef.current, QS.length - 1)];
    if (q.text) advance(wish.trim(), true);
    else advance(pickedRef.current.slice(), true);
  }, [advance, wish]);

  const skipQ = useCallback(() => {
    clearTimeout(timers.current.nq);
    advance(null, false);
  }, [advance]);

  const value = useMemo<WaitlistApi>(
    () => ({ email, setEmail, err, submitting, sent, submit, position, shown, delta, moved, stats, modal, openModal, closeModal, qi, picked, wish, setWish, answerErr, pick, nextQ, skipQ }),
    [email, setEmail, err, submitting, sent, submit, position, shown, delta, moved, stats, modal, openModal, closeModal, qi, picked, wish, setWish, answerErr, pick, nextQ, skipQ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
