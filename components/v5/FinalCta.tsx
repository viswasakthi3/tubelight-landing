"use client";

import { Joined, Proof, SignupForm } from "./SignupForm";
import { useWaitlist } from "./WaitlistContext";

export function FinalCta() {
  const w = useWaitlist();
  return (
    <>
      <section id="join" className="sec" style={{ paddingTop: 0, scrollMarginTop: 76 }}>
        <div className="wrapx">
          <div className="cta">
            <div style={{ position: "relative", maxWidth: 760, margin: "0 auto", display: "flex", flexDirection: "column", alignItems: "center", gap: 22 }}>
              <h2 className="h2" style={{ fontSize: "clamp(38px, 5.2vw, 66px)" }}>Get early access.</h2>
              <p className="lede" style={{ maxWidth: 540 }}>We invite people in batches, in line order. Tell us how you’ll use Tubelight and you’ll move up the line.</p>
              {!w.sent ? <SignupForm id="em-join" placement="final" label="Join the waitlist" style={{ marginTop: 4 }} /> : <Joined />}
              {!w.sent ? <p className="micro">We’ll email you when your invite is ready. Nothing else.</p> : null}
              <Proof center live />
              <div className="getahead">
                <div className="ga"><b>1</b><span>Join with your email. It takes ten seconds.</span></div>
                <div className="ga"><b>2</b><span>Tell us how you’ll use it. Every answer moves you up the line.</span></div>
                <div className="ga"><b>3</b><span>Get your invite by email and download Tubelight.</span></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="sec" style={{ paddingTop: 0 }}>
        <div className="wrapx">
          <div className="xsell">
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "#6F6B86" }}>More from Tubelight</p>
              <p className="disp" style={{ margin: 0, fontSize: "clamp(26px, 3vw, 34px)", lineHeight: 1.1, fontWeight: 600, letterSpacing: "-0.03em" }}>Quick Search AI</p>
              <p style={{ margin: 0, maxWidth: 560, color: "#57536E" }}>
                Hold <span className="kbd">Tab</span> + <span className="kbd">Q</span> and ask out loud. One clear answer pops up in the corner of your screen — no new tabs.
              </p>
            </div>
            <a href="https://search.tubelight.net" target="_blank" rel="noopener" className="btn ghost">
              Try Quick Search
              <svg viewBox="0 0 24 24" aria-hidden="true" style={{ width: 16, height: 16, fill: "none", stroke: "currentColor", strokeWidth: 2.2, strokeLinecap: "round", strokeLinejoin: "round" }}>
                <path d="M7 17 17 7M9 7h8v8" />
              </svg>
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
