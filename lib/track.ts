type PostHogLike = { capture: (event: string, props?: Record<string, unknown>) => void };

/** Fire an analytics event if PostHog is on the page; otherwise do nothing. Never pass emails or answer text. */
export function track(event: string, props?: Record<string, string | number | boolean | undefined>): void {
  try {
    const ph = (window as unknown as { posthog?: PostHogLike }).posthog;
    if (ph && typeof ph.capture === "function") ph.capture(event, props);
  } catch {
    /* analytics must never break the page */
  }
}
