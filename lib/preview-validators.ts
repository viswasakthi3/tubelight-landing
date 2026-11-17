const MIN_TOPIC = 2;
const MAX_TOPIC = 200;
const MAX_EMAIL = 254;
const EMAIL_RE = /^[^\s@\x00-\x1f\x7f]+@[^\s@\x00-\x1f\x7f]+\.[^\s@\x00-\x1f\x7f]{2,}$/;

/** Topic validation matching backend rules */
export function validateTopic(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const topic = raw.trim();
  if (topic.length < MIN_TOPIC || topic.length > MAX_TOPIC) return null;
  if (/[\r\n]/.test(topic)) return null;
  if (/https?:\/\/|www\./i.test(topic)) return null;
  if (/^\S+\.[a-z]{2,}(\/\S*)?$/i.test(topic)) return null;
  return topic;
}

/** Email validation matching backend and waitlist rules */
export function validateEmail(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const email = raw.trim().toLowerCase();
  if (email.length < 5 || email.length > MAX_EMAIL) return null;
  if (!EMAIL_RE.test(email)) return null;
  return email;
}
