"use client";

import { useEffect, useRef, type KeyboardEvent } from "react";
import { PRIORITY_POINTS } from "@/lib/waitlist-shared";
import { fmt, trapTab } from "./media";
import { OTHER, QS } from "./questions";
import { InviteFriends, InviteStatus, SignupForm } from "./SignupForm";
import { useWaitlist } from "./WaitlistContext";

const X = (
  <svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18" /></svg>
);

export function WaitlistDialog() {
  const w = useWaitlist();
  const dlg = useRef<HTMLDivElement | null>(null);
  const otherRef = useRef<HTMLInputElement | null>(null);
  const otherOn = w.modal === "q" && w.picked.includes(OTHER);

  // Focus the "Other" box as soon as it appears.
  useEffect(() => {
    if (otherOn) otherRef.current?.focus();
  }, [otherOn, w.qi]);

  // Move focus into the dialog whenever it opens or changes step.
  useEffect(() => {
    if (!w.modal) return;
    const id = setTimeout(() => dlg.current?.focus({ preventScroll: true }), 60);
    return () => clearTimeout(id);
  }, [w.modal]);

  if (!w.modal) return null;

  const q = QS[Math.min(w.qi, QS.length - 1)];
  const showNext = !!w.answerErr || q.multi || !!q.about || otherOn;
  const answered = w.picked.length > 0 || w.aboutText.trim() !== "";
  const onEnter = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (answered) w.nextQ();
    }
  };
  const emailShown = w.email.trim();

  return (
    <div className="ovl">
      <div
        className="dlg"
        role="dialog"
        aria-modal="true"
        aria-labelledby="wl-title"
        tabIndex={-1}
        ref={dlg}
        onKeyDown={(e) => {
          if (e.key === "Escape") w.closeModal();
          else trapTab(e);
        }}
      >
        <button type="button" className="xbtn" aria-label="Close" onClick={w.closeModal}>{X}</button>

        {w.modal === "email" ? (
          <div className="fade" style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <img src="/brand/mark.png" alt="" style={{ display: "block", width: 40, height: "auto" }} />
            <h2 id="wl-title" className="disp" style={{ margin: 0, fontSize: 32, lineHeight: 1.1, fontWeight: 600, letterSpacing: "-0.03em" }}>Join the waitlist</h2>
            <p style={{ margin: 0, color: "#57536E" }}>We invite people in batches, in line order. It takes ten seconds.</p>
            <SignupForm id="em-dlg" placement="dialog" label="Join" style={{ maxWidth: "none" }} />
            <p className="micro">We’ll email you when your invite is ready. Nothing else.</p>
            <InviteStatus />
          </div>
        ) : null}

        {w.modal === "q" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14, paddingRight: 44 }}>
              <span className="okdot" aria-hidden="true" style={{ width: 40, height: 40 }}>
                <svg viewBox="0 0 24 24" style={{ width: 20, height: 20 }}><path d="m5 12 5 5 9-10" /></svg>
              </span>
              <div style={{ minWidth: 0 }}>
                <h2 id="wl-title" className="disp" style={{ margin: 0, fontSize: 28, lineHeight: 1.1, fontWeight: 600, letterSpacing: "-0.03em" }}>You’re on the waitlist!</h2>
                <p style={{ margin: "2px 0 0", fontSize: 15, color: "#6F6B86", overflowWrap: "anywhere" }}>{emailShown}</p>
              </div>
            </div>
            <div className="posbox">
              <div>
                <p style={{ margin: 0, color: "#4B33B8", fontWeight: 600 }}>Your invite priority</p>
                <p className="posnum" aria-live="polite">{fmt(w.points)} points</p>
              </div>
            </div>
            <p style={{ margin: 0, color: "#57536E" }}>People with more points are invited first. Earn {PRIORITY_POINTS} points for each question you answer.</p>
            <div className="segs">
              {QS.map((_, i) => (
                <span key={i} className={"seg" + (w.qi > i ? " on" : "")} />
              ))}
            </div>

            <div className="fade" key={w.qi} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "#6F6B86" }}>
                Question {Math.min(w.qi + 1, QS.length)} of {QS.length}{q.multi ? " · pick any" : ""}
              </p>
              <p className="disp" style={{ margin: 0, fontSize: 22, fontWeight: 600, letterSpacing: "-0.02em", textWrap: "balance" }}>{q.q}</p>
              <div className="qchips">
                {[...q.opts, ...(q.other ? [OTHER] : [])].map((label) => {
                  const on = w.picked.includes(label);
                  return (
                    <button key={label} type="button" className={"qchip" + (on ? " on" : "")} disabled={w.savingAnswer} aria-pressed={on} onClick={() => w.pick(label)}>
                      {label}
                    </button>
                  );
                })}
              </div>
              {otherOn ? (
                <div className="qfield">
                  <label htmlFor="q-other">Tell us in a few words</label>
                  <input
                    disabled={w.savingAnswer}
                    id="q-other"
                    ref={otherRef}
                    className="qinput"
                    type="text"
                    maxLength={80}
                    value={w.otherText}
                    onChange={(e) => w.setOtherText(e.target.value)}
                    onKeyDown={onEnter}
                  />
                </div>
              ) : null}
              {q.about ? (
                <div className="qfield">
                  <label htmlFor="q-about">{q.about.label} <span className="qopt">(optional)</span></label>
                  <input
                    disabled={w.savingAnswer}
                    id="q-about"
                    className="qinput"
                    type="text"
                    maxLength={120}
                    placeholder={q.about.placeholder}
                    value={w.aboutText}
                    onChange={(e) => w.setAboutText(e.target.value)}
                    onKeyDown={onEnter}
                  />
                </div>
              ) : null}
            </div>
            {w.answerErr ? <p className="err" role="alert">{w.answerErr}</p> : null}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
              <button type="button" className="linkbtn" style={{ color: "#6F6B86" }} disabled={w.savingAnswer} onClick={w.skipQ}>Skip this question</button>
              {showNext ? (
                <button type="button" className="btn sm" disabled={!answered || w.savingAnswer} onClick={w.nextQ}>
                  {w.savingAnswer ? "Saving…" : w.answerErr ? "Try again" : "Next"}
                </button>
              ) : null}
            </div>
            <InviteFriends />
          </div>
        ) : null}

        {w.modal === "done" ? (
          <div className="fade" style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 18 }}>
            <span className="big-ic" aria-hidden="true">
              <svg viewBox="0 0 24 24"><path d="M12 19V5" /><path d="m5 12 7-7 7 7" /></svg>
            </span>
            <h2 id="wl-title" className="disp" style={{ margin: 0, fontSize: 32, lineHeight: 1.1, fontWeight: 600, letterSpacing: "-0.03em", paddingRight: 44 }}>
              Your spot is saved
            </h2>
            <p className="posbox" aria-live="polite">Your invite priority <strong>{fmt(w.points)} points</strong></p>
            <p style={{ margin: 0, color: "#57536E" }}>
              We’ll email <strong style={{ color: "#221E3F", fontWeight: 600, overflowWrap: "anywhere" }}>{emailShown}</strong> as soon as your invite is ready.
            </p>
            <InviteFriends />
            <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 10, padding: 20, borderRadius: 20, background: "#F6F3FB" }}>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "#6F6B86" }}>While you wait</p>
              <p style={{ margin: 0, color: "#221E3F" }}>
                Try <strong style={{ fontWeight: 600 }}>Quick Search AI</strong> — hold Tab + Q, ask out loud, and get one clear answer.
              </p>
              <a href="https://search.tubelight.net" target="_blank" rel="noopener" className="linkbtn" style={{ alignSelf: "flex-start" }}>
                Open Quick Search
                <svg viewBox="0 0 24 24" aria-hidden="true" style={{ width: 16, height: 16, fill: "none", stroke: "currentColor", strokeWidth: 2.2, strokeLinecap: "round", strokeLinejoin: "round" }}>
                  <path d="M7 17 17 7M9 7h8v8" />
                </svg>
              </a>
            </div>
            <button type="button" className="btn" style={{ width: "100%" }} onClick={w.closeModal}>Done</button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
