import { createHmac, timingSafeEqual } from "node:crypto";

let warned = false;

function secret(): string {
  const s = process.env.WAITLIST_SECRET;
  if (s) return s;
  if (!warned) {
    warned = true;
    console.warn("[waitlist] WAITLIST_SECRET is not set; using an insecure development secret.");
  }
  return "tubelight-dev-waitlist-secret";
}

/** base64url HMAC-SHA256 of the (lower-cased) email. */
export function signToken(email: string): string {
  return createHmac("sha256", secret()).update(email.trim().toLowerCase()).digest("base64url");
}

export function verifyToken(email: string, token: unknown): boolean {
  if (typeof token !== "string" || token.length === 0 || token.length > 200) return false;
  const a = Buffer.from(signToken(email));
  const b = Buffer.from(token);
  return a.length === b.length && timingSafeEqual(a, b);
}
