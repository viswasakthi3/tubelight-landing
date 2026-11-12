"use client";

import { useEffect, useRef } from "react";
import { fmt, trapTab } from "./media";
import { QS } from "./questions";
import { Proof, SignupForm } from "./SignupForm";
import { useWaitlist } from "./WaitlistContext";

const X = (
  <svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18" /></svg>
);

export function WaitlistDialog() {
  const w = useWaitlist();
  const dlg = useRef<HTMLDivElement | null>(null);

  // Move focus into the dialog whenever it opens or changes step.
  useEffect(() => {
    if (!w.modal) return;
    const id = setTimeout(() => dlg.current?.focus({ preventScroll: true }), 60);
    return () => clearTimeout(id);
  }, [w.modal]);

  if (!w.modal) return null;

  const hasCount = w.position !== null;
  const q = QS[Math.min(w.qi, QS.length - 1)];
  const posText = "#" + fmt(w.shown);
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
            <Proof live />
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
            {hasCount ? (
              <div className="posbox">
                <div>
                  <p style={{ margin: "0 0 6px", fontSize: 14, fontWeight: 600, color: "#4B33B8" }}>Your place in line</p>
                  <p className="posnum">{posText}</p>
                </div>
                {w.delta > 0 ? <span className="delta">↑ {fmt(w.delta)} spots</span> : null}
              </div>
            ) : null}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <p className="disp" style={{ margin: 0, fontSize: 21, fontWeight: 600, letterSpacing: "-0.02em" }}>Want an earlier invite?</p>
              <p style={{ margin: 0, color: "#57536E" }}>Tell us how you’ll use Tubelight. Every answer moves you up the line, so you’re invited sooner.</p>
            </div>
            <div className="segs">
              {QS.map((_, i) => (
                <span key={i} className={"seg" + (w.qi > i ? " on" : "")} />
              ))}
            </div>

            <div className="fade" key={w.qi} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "#6F6B86" }}>
                Question {Math.min(w.qi + 1, QS.length)} of 5{q.multi ? " · pick any" : q.text ? " · optional" : ""}
              </p>
              <p className="disp" style={{ margin: 0, fontSize: 22, fontWeight: 600, letterSpacing: "-0.02em", textWrap: "balance" }}>{q.q}</p>
              {!q.text ? (
                <div className="qchips">
                  {(q.opts ?? []).map((label) => {
                    const on = w.picked.includes(label);
                    return (
                      <button key={label} type="button" className={"qchip" + (on ? " on" : "")} aria-pressed={on} onClick={() => w.pick(label)}>
                        {label}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <>
                  <label htmlFor="q-wish" className="sr">{q.q}</label>
                  <textarea
                    id="q-wish"
                    className="qtext"
                    maxLength={200}
                    placeholder="e.g. how mutual funds actually make money"
                    value={w.wish}
                    onChange={(e) => w.setWish(e.target.value)}
                  />
                </>
              )}
            </div>
            {w.answerErr ? <p className="err" role="alert">{w.answerErr}</p> : null}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
              <button type="button" className="linkbtn" style={{ color: "#6F6B86" }} onClick={w.skipQ}>Skip this question</button>
              {q.multi || q.text ? (
                <button
                  type="button"
                  className="btn sm"
                  disabled={q.multi ? w.picked.length === 0 : !w.wish.trim()}
                  onClick={w.nextQ}
                >
                  {q.text ? "Finish" : "Next"}
                </button>
              ) : null}
            </div>
          </div>
        ) : null}

        {w.modal === "done" ? (
          <div className="fade" style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 18 }}>
            <span className="big-ic" aria-hidden="true">
              <svg viewBox="0 0 24 24"><path d="M12 19V5" /><path d="m5 12 7-7 7 7" /></svg>
            </span>
            <h2 id="wl-title" className="disp" style={{ margin: 0, fontSize: 32, lineHeight: 1.1, fontWeight: 600, letterSpacing: "-0.03em", paddingRight: 44 }}>
              {w.moved > 0 ? `You moved up ${fmt(w.moved)} spots!` : "You’re all set!"}
            </h2>
            {hasCount ? (
              <p style={{ margin: 0, fontSize: 18, color: "#221E3F" }}>
                You’re now <strong style={{ color: "#4B33B8" }}>{"#" + fmt(w.position as number)}</strong> in line.
              </p>
            ) : null}
            <p style={{ margin: 0, color: "#57536E" }}>
              We’ll email <strong style={{ color: "#221E3F", fontWeight: 600, overflowWrap: "anywhere" }}>{emailShown}</strong> as soon as your invite is ready.
            </p>
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
