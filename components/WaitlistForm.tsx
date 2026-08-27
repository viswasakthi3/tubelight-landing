"use client";

import { useId, useState } from "react";
import { AnimatePresence, motion } from "motion/react";

type Status = "idle" | "loading" | "done" | "error";

const ROLES = ["Student", "Researcher", "Professional", "Just curious"];

export function WaitlistForm({
  source,
  tone = "light",
  askRole = false,
}: {
  source: string;
  tone?: "light" | "dark";
  askRole?: boolean;
}) {
  const id = useId();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<string | null>(null);
  const [company, setCompany] = useState(""); // honeypot
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  const dark = tone === "dark";

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (status === "loading") return;
    setStatus("loading");

    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, role, source, company }),
      });
      const data = (await response.json()) as { ok: boolean; error?: string; message?: string };

      if (!response.ok || !data.ok) {
        setStatus("error");
        setMessage(data.error ?? "Something went wrong. Try again in a moment.");
        return;
      }

      setStatus("done");
      setMessage(data.message ?? "You're on the list.");
    } catch {
      setStatus("error");
      setMessage("Couldn't reach the server. Check your connection and try again.");
    }
  }

  if (status === "done") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className={[
          "flex items-start gap-3 rounded-2xl px-5 py-4 text-left",
          dark ? "bg-white/10 text-white ring-1 ring-white/15" : "bg-filament-soft text-ink ring-1 ring-filament/30",
        ].join(" ")}
        role="status"
      >
        <span
          className={[
            "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full",
            dark ? "bg-filament-2 text-night" : "bg-filament text-white",
          ].join(" ")}
          aria-hidden="true"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
            <path d="M7.6 13.4 4.2 10l1.2-1.2 2.2 2.2 6-6L14.8 6z" />
          </svg>
        </span>
        <div>
          <p className="text-[0.95rem] font-semibold">{message}</p>
          <p className={dark ? "mt-0.5 text-sm text-white/65" : "mt-0.5 text-sm text-ink-3"}>
            Invites go out in weekly batches. Watch for an email from the Tubelight team.
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="w-full">
      <div
        className={[
          "flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2 sm:rounded-2xl sm:p-1.5",
          dark ? "sm:bg-white/8 sm:ring-1 sm:ring-white/15" : "sm:bg-white sm:shadow-lift sm:ring-1 sm:ring-line",
        ].join(" ")}
      >
        <label htmlFor={`${id}-email`} className="sr-only">
          Email address
        </label>
        <input
          id={`${id}-email`}
          type="email"
          name="email"
          required
          autoComplete="email"
          inputMode="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (status === "error") setStatus("idle");
          }}
          aria-invalid={status === "error"}
          className={[
            "min-w-0 flex-1 rounded-xl px-4 py-3.5 text-base outline-none transition",
            dark
              ? "bg-white/5 text-white ring-1 ring-white/15 placeholder:text-white/40 focus:ring-2 focus:ring-filament-2 sm:bg-transparent sm:ring-0 sm:focus:ring-0"
              : "bg-white text-ink ring-1 ring-line placeholder:text-ink-3/70 focus:ring-2 focus:ring-violet sm:ring-0 sm:focus:ring-0",
          ].join(" ")}
        />

        {/* Honeypot — hidden from people, catnip for bots */}
        <input
          type="text"
          name="company"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          className="pointer-events-none absolute h-0 w-0 opacity-0"
        />

        <button
          type="submit"
          disabled={status === "loading"}
          className={[
            "group inline-flex shrink-0 items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-base font-semibold transition",
            "disabled:cursor-wait disabled:opacity-70",
            dark
              ? "bg-filament text-night hover:bg-filament-2"
              : "bg-ink text-paper hover:bg-violet",
          ].join(" ")}
        >
          {status === "loading" ? "Sending…" : "Request beta access"}
          <svg
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
            className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
          >
            <path d="M10.6 4 9.4 5.2 13.4 9.2H3v1.6h10.4l-4 4 1.2 1.2 6-6z" />
          </svg>
        </button>
      </div>

      {askRole && (
        <fieldset className="mt-4">
          <legend className={dark ? "text-sm text-white/55" : "text-sm text-ink-3"}>
            Optional — helps us pick the first batch
          </legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {ROLES.map((option) => {
              const active = role === option;
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => setRole(active ? null : option)}
                  aria-pressed={active}
                  className={[
                    "rounded-full px-3.5 py-1.5 text-sm transition",
                    active
                      ? dark
                        ? "bg-filament text-night"
                        : "bg-ink text-paper"
                      : dark
                        ? "bg-white/8 text-white/75 ring-1 ring-white/15 hover:bg-white/15"
                        : "bg-white text-ink-2 ring-1 ring-line hover:border-line-strong hover:bg-paper-2",
                  ].join(" ")}
                >
                  {option}
                </button>
              );
            })}
          </div>
        </fieldset>
      )}

      <AnimatePresence>
        {status === "error" && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            role="alert"
            className={dark ? "mt-3 text-sm text-filament-2" : "mt-3 text-sm text-[#b4401f]"}
          >
            {message}
          </motion.p>
        )}
      </AnimatePresence>
    </form>
  );
}
