type PostHogLike = { capture: (event: string, props?: Record<string, unknown>) => void };

/**
 * Every event the page sends. Props are numbers, flags or short fixed words (a slug, an error code,
 * a suggestion kind) — never a typed topic, an email or any answer text.
 */
export type TrackEvent =
  | "hero_video_play"
  | "mode_switch"
  | "demo_video_play"
  | "topic_search"
  | "waitlist_submit"
  | "waitlist_answer"
  | "waitlist_done"
  | "player_open" // { slug } for a ready-made video, { live: true } for a live preview
  | "player_fullscreen"
  | "preview_start"
  | "preview_ready" // { ms } from start to ready
  | "preview_gate_submit"
  | "preview_error" // { code }
  | "suggestion_pick"; // { kind: watch | topic | make }

/** Fire an analytics event if PostHog is on the page; otherwise do nothing. Never pass emails or answer text. */
export function track(event: TrackEvent, props?: Record<string, string | number | boolean | undefined>): void {
  try {
    const ph = (window as unknown as { posthog?: PostHogLike }).posthog;
    if (ph && typeof ph.capture === "function") ph.capture(event, props);
  } catch {
    /* analytics must never break the page */
  }
}
