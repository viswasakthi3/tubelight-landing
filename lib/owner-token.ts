import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

export const OWNER_COOKIE_NAME = "tb_owner";
const MIN_OWNER_ID_LENGTH = 32;

function getOwnerSecret(): string {
  const s = process.env.OWNER_COOKIE_SECRET || process.env.WEB_EXPLAIN_SECRET;
  if (s && s.replace(/\s/g, "").length >= 32) return s;
  throw new Error("A strong preview owner signing secret is required.");
}

/** Generates a cryptographically random, URL-safe owner identifier (>= 32 chars). */
export function generateOwnerId(): string {
  // 32 random bytes -> 43 url-safe base64 characters
  return randomBytes(32).toString("base64url");
}

/** Signs an ownerId into a tamper-evident cookie value: v1.<ownerId>.<hmac> */
export function signOwnerCookie(ownerId: string): string {
  if (!/^[A-Za-z0-9_-]{32,128}$/.test(ownerId)) {
    throw new Error("Invalid ownerId length for signing");
  }
  const payload = `v1.${ownerId}`;
  const sig = createHmac("sha256", getOwnerSecret()).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

/**
 * Validates the cookie value and returns the verified ownerId, or null if missing/tampered.
 * Validates in constant time.
 */
export function verifyOwnerCookie(cookieValue: string | undefined | null): string | null {
  if (!cookieValue || typeof cookieValue !== "string") return null;

  const parts = cookieValue.split(".");
  if (parts.length !== 3 || parts[0] !== "v1") return null;

  const [version, ownerId, signature] = parts;
  if (!ownerId || ownerId.length < MIN_OWNER_ID_LENGTH || ownerId.length > 128 || signature.length !== 43) return null;
  if (!/^[A-Za-z0-9_-]+$/.test(ownerId)) return null;

  try {
    const payload = `${version}.${ownerId}`;
    const expectedSig = createHmac("sha256", getOwnerSecret()).update(payload).digest("base64url");

    const a = Buffer.from(signature);
    const b = Buffer.from(expectedSig);

    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      return null;
    }
    return ownerId;
  } catch {
    return null;
  }
}

/**
 * Extracts and verifies the owner ID from request Cookie header.
 * If missing, corrupt, or invalid signature, generates a fresh unprivileged owner ID.
 */
export function getOwnerFromRequest(req: Request): { ownerId: string; isNew: boolean } {
  const cookieHeader = req.headers.get("cookie") || "";
  let rawValue: string | null = null;

  for (const pair of cookieHeader.split(";")) {
    const [k, ...v] = pair.trim().split("=");
    if (k === OWNER_COOKIE_NAME) {
      rawValue = v.join("=");
      break;
    }
  }

  const verified = verifyOwnerCookie(rawValue);
  if (verified) {
    return { ownerId: verified, isNew: false };
  }

  return { ownerId: generateOwnerId(), isNew: true };
}

/** Serializes owner cookie for Set-Cookie response header. */
export function serializeOwnerCookie(ownerId: string): string {
  const value = signOwnerCookie(ownerId);
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  // 1 year max-age
  return `${OWNER_COOKIE_NAME}=${value}; Path=/; Max-Age=31536000; SameSite=Lax; HttpOnly${secure}`;
}
