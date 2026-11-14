"use client";

import { useEffect, useState } from "react";
import { PRIORITY_POINTS } from "@/lib/waitlist-shared";
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
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  return (
    <>
      <form
        method="post"
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
          disabled={!ready}
          className="email-in"
          type="email"
          autoComplete="email"
          placeholder="Your email"
          value={w.email}
          onChange={(e) => w.setEmail(e.target.value)}
        />
        <button type="submit" className="btn" disabled={!ready || w.submitting}>
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

/** Show the saved invite score and reopen the signup dialog. */
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
      <span>You’re on the waitlist · {fmt(w.points)} priority points</span>
      <button type="button" className="linkbtn" onClick={w.openModal}>
        {done ? "See your spot" : "Move up the line →"}
      </button>
    </div>
  );
}

export function InviteFriends() {
  const { referralUrl } = useWaitlist();
  const [status, setStatus] = useState<"idle" | "copied" | "manual">("idle");
  if (!referralUrl) return null;
  async function copy() {
    try {
      await navigator.clipboard.writeText(referralUrl);
      setStatus("copied");
    } catch {
      setStatus("manual");
    }
  }
  return (
    <div className="invite-box">
      <strong>Invite a friend for {PRIORITY_POINTS} more points</strong>
      <p>Earn {PRIORITY_POINTS} priority points when a new person joins through your link.</p>
      <button type="button" className="btn sm" onClick={copy}>
        {status === "copied" ? "Link copied" : "Copy invite link"}
      </button>
      <span role="status" className="sr">{status === "copied" ? "Invite link copied" : ""}</span>
      {status === "manual" ? <label>Copy this invite link<input readOnly value={referralUrl} onFocus={(e) => e.currentTarget.select()} /></label> : null}
    </div>
  );
}

export function InviteStatus() {
  return <p className="invite-status"><strong>Early access</strong> Earn {PRIORITY_POINTS} priority points for each friend who joins.</p>;
}
