"use client";

import { fmt } from "./media";
import { QS } from "./questions";
import { useWaitlist, type Placement } from "./WaitlistContext";

/** The email field + button, shared by the hero, the final call-to-action and the dialog. */
export function SignupForm({
  id,
  placement,
  label,
  style,
  topic,
  quiet,
  onJoined,
}: {
  id: string;
  placement: Placement;
  label: string;
  style?: React.CSSProperties;
  /** saved with the spot (the live preview passes the visitor's topic) */
  topic?: string;
  /** skip the questions dialog after joining */
  quiet?: boolean;
  onJoined?: () => void;
}) {
  const w = useWaitlist();
  return (
    <>
      <form
        className="signup"
        style={style}
        onSubmit={(e) => {
          e.preventDefault();
          void w.submit(placement, { topic, quiet }).then((ok) => {
            if (ok) onJoined?.();
          });
        }}
      >
        <label htmlFor={id} className="sr">
          Email address
        </label>
        <input
          id={id}
          name="email"
          className="email-in"
          type="email"
          autoComplete="email"
          placeholder="Your email"
          value={w.email}
          onChange={(e) => w.setEmail(e.target.value)}
        />
        <button type="submit" className="btn" disabled={w.submitting}>
          {label}
        </button>
      </form>
      {w.err ? (
        <p className="err" role="alert">
          {w.err}
        </p>
      ) : null}
    </>
  );
}

/** "You're on the waitlist — #N in line" + the button that opens the dialog. */
export function Joined() {
  const w = useWaitlist();
  const done = w.qi >= QS.length;
  return (
    <div className="joined fade" role="status">
      <span className="okdot" aria-hidden="true">
        <svg viewBox="0 0 24 24">
          <path d="m5 12 5 5 9-10" />
        </svg>
      </span>
      <span>You’re on the waitlist{w.position !== null ? ` — #${fmt(w.position)} in line` : ""}</span>
      <button type="button" className="linkbtn" onClick={w.openModal}>
        {done ? "See your spot" : "Move up the line →"}
      </button>
    </div>
  );
}

/** Real count only. Falls back to the design's quiet line until the list is big enough. */
export function useProof() {
  const { stats } = useWaitlist();
  const show = !!stats && stats.show && stats.total > 0;
  return {
    main: show ? `${fmt(stats!.total)} people` : "Invites go out in batches",
    rest: show ? " are already waiting" : " — earlier sign-ups get in first",
    week: show && stats!.thisWeek > 0 ? fmt(stats!.thisWeek) : null,
  };
}

export function Proof({ center, live }: { center?: boolean; live?: boolean }) {
  const p = useProof();
  return (
    <div className="proof" style={center ? { justifyContent: "center" } : undefined}>
      {live ? <span className="live" aria-hidden="true" /> : null}
      <span>
        <strong>{p.main}</strong>
        {p.rest}
      </span>
    </div>
  );
}
