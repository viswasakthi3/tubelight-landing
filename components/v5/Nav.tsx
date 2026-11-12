"use client";

import Image from "next/image";
import { useWaitlist } from "./WaitlistContext";

export function Nav() {
  const w = useWaitlist();
  return (
    <header className="topbar">
      <nav aria-label="Main" className="wrapx wide" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24, minHeight: 70 }}>
        <a href="#top" aria-label="Tubelight home" style={{ display: "flex", alignItems: "center", minHeight: 44 }}>
          <Image src="/brand/logo.png" alt="Tubelight" width={113} height={30} priority style={{ display: "block", height: 30, width: "auto" }} />
        </a>
        <div className="navlinks" style={{ alignItems: "center", gap: 34 }}>
          <a href="#how" className="nl">How it works</a>
          <a href="#examples" className="nl">Examples</a>
          <a href="#features" className="nl">Features</a>
          <a href="#faq" className="nl">FAQ</a>
        </div>
        <button type="button" className="btn sm" onClick={w.openModal}>
          {w.sent ? "Your spot" : "Join the waitlist"}
        </button>
      </nav>
    </header>
  );
}
