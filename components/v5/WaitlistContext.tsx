"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { track } from "@/lib/track";
import { OTHER, QS } from "./questions";

export type Placement = "hero" | "final" | "dialog" | "preview";
export type Step = null | "email" | "q" | "done";

export type WaitlistApi = {
  referralUrl: string;
  email: string;
  setEmail: (v: string) => void;
  err: string;
  errPlacement: Placement | null;
  submitting: boolean;
  sent: boolean;
  /**
   * Join the waitlist. `topic` is saved with the spot (the live preview sends the visitor's topic);
   * `quiet` skips the questions dialog, which the preview gate does not want. Resolves true when joined.
   */
  submit: (placement: Placement, opts?: { topic?: string; quiet?: boolean }) => Promise<boolean>;
  points: number;
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
  savingAnswer: boolean;
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
  const [errPlacement, setErrPlacement] = useState<Placement | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [referralUrl, setReferralUrl] = useState("");
  const [sent, setSent] = useState(false);
  const [points, setPoints] = useState(0);
  const [modal, setModal] = useState<Step>(null);
  const [qi, setQi] = useState(0);
  const [picked, setPickedState] = useState<string[]>([]);
  const [otherText, setOtherRaw] = useState("");
  const [aboutText, setAboutRaw] = useState("");
  const savingRef = useRef(false);
  const [savingAnswer, setSavingAnswer] = useState(false);
  const [answerErr, setAnswerErr] = useState("");

  const token = useRef("");
  const sentEmail = useRef("");
  const qiRef = useRef(0);
  const pickedRef = useRef<string[]>([]);
  const otherRef = useRef("");
  const aboutRef = useRef("");
  const timers = useRef<{ nq?: ReturnType<typeof setTimeout> }>({});

  useEffect(() => {
    const t = timers.current;
    return () => {
      clearTimeout(t.nq);
    };
  }, []);

  const setEmail = useCallback((v: string) => {
    setEmailRaw(v);
    setErr("");
    setErrPlacement(null);
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

  const submit = useCallback(
    async (placement: Placement, opts?: { topic?: string; quiet?: boolean }): Promise<boolean> => {
      const v = email.trim();
      if (!EMAIL_RE.test(v)) {
        setErr("That email doesn’t look quite right — mind checking it?");
        setErrPlacement(placement);
        return false;
      }
      setSubmitting(true);
      setErr("");
      setErrPlacement(null);
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
          setErrPlacement(placement);
          return false;
        }
        token.current = typeof j.token === "string" ? j.token : "";
        sentEmail.current = v.toLowerCase();
        setPoints(j.boost ?? 0);
        if (typeof j.referralCode === "string") {
          const url = new URL("/", location.origin);
          url.searchParams.set("ref", j.referralCode);
          setReferralUrl(url.href);
        }
        const nextIdx = typeof j.nextQuestion === "number" ? Math.max(0, Math.min(QS.length, j.nextQuestion)) : 0;
        setSent(true);
        setPicked([]);
        setQiBoth(nextIdx);
        setAnswerErr("");
        clearTexts();
        if (!opts?.quiet) setModal(nextIdx >= QS.length ? "done" : "q");
        track("waitlist_submit", { placement, duplicate: !!j.duplicate });
        return true;
      } catch {
        setErr("Couldn’t reach the server. Check your connection and try again.");
        setErrPlacement(placement);
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
        if (typeof data?.boost === "number") setPoints((prev) => Math.max(prev, data.boost));
      } catch { /* Keep the last confirmed position. */ }
    };
    window.addEventListener("focus", refresh);
    return () => window.removeEventListener("focus", refresh);
  }, [sent]);

  const openModal = useCallback(() => {
    setErr("");
    setErrPlacement(null);
    setModal(!sent ? "email" : qiRef.current >= QS.length ? "done" : "q");
  }, [sent]);
  const closeModal = useCallback(() => setModal(null), []);

  const advance = useCallback(
    async (value: string[] | null) => {
      const q = qiRef.current;
      if (q >= QS.length || savingRef.current) return;
      setAnswerErr("");
      if (value) {
        savingRef.current = true;
        setSavingAnswer(true);
        try {
          const res = await fetch("/api/waitlist/answers", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ email: sentEmail.current, token: token.current, question: q, answer: value }),
          });
          const data = await res.json();
          if (!res.ok || !data.ok || typeof data.boost !== "number") throw new Error("Save failed");
          setPoints((prev) => Math.max(prev, data.boost));
        } catch {
          setAnswerErr("Your answer couldn’t be saved. Try again or skip this question.");
          return;
        } finally {
          savingRef.current = false;
          setSavingAnswer(false);
        }
      }
      setPicked([]);
      clearTexts();
      const next = q + 1;
      setQiBoth(next);
      track("waitlist_answer", { question: q, skipped: !value });
      if (next === QS.length) {
        setModal((step) => step === "q" ? "done" : step);
        track("waitlist_done");
      }
    },
    [setPicked, clearTexts, setQiBoth],
  );

  const pick = useCallback(
    (label: string) => {
      if (savingRef.current) return;
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
    if (out.length) void advance(out);
  }, [advance]);
  const nextQRef = useRef(nextQ);
  nextQRef.current = nextQ;

  const skipQ = useCallback(() => {
    clearTimeout(timers.current.nq);
    void advance(null);
  }, [advance]);

  const value = useMemo<WaitlistApi>(
    () => ({ referralUrl, email, setEmail, err, errPlacement, submitting, sent, submit, points, modal, openModal, closeModal, qi, picked, otherText, setOtherText, aboutText, setAboutText, savingAnswer, answerErr, pick, nextQ, skipQ }),
    [referralUrl, email, setEmail, err, errPlacement, submitting, sent, submit, points, modal, openModal, closeModal, qi, picked, otherText, setOtherText, aboutText, setAboutText, savingAnswer, answerErr, pick, nextQ, skipQ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
