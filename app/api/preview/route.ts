import { isIP } from "node:net";
import { NextResponse } from "next/server";
import { makeLimiter } from "@/lib/rate-limit";
import { getOwnerFromRequest, serializeOwnerCookie } from "@/lib/owner-token";
import { saveSignup } from "@/lib/waitlist";
import { validateTopic, validateEmail } from "@/lib/preview-validators";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 4096;
const burstLimit = makeLimiter(10, 60_000);
const SITE_HOSTS = new Set(["tubelight.net", "www.tubelight.net", "search.tubelight.net"]);
const LOCAL_HOSTS = new Set(["localhost", "search.localhost", "127.0.0.1", "[::1]"]);
const SITE_ORIGINS = new Set([...SITE_HOSTS].map((host) => `https://${host}`));

function allowedRequest(request: Request): boolean {
  try {
    const host = new URL(`http://${request.headers.get("host") || ""}`).hostname;
    const local = process.env.NODE_ENV !== "production";
    if (!SITE_HOSTS.has(host) && !(local && LOCAL_HOSTS.has(host))) return false;
    if (request.headers.get("sec-fetch-site") === "cross-site") return false;
    const origin = request.headers.get("origin");
    if (!origin) return true;
    if (SITE_ORIGINS.has(origin)) return true;
    const parsed = new URL(origin);
    return local && LOCAL_HOSTS.has(parsed.hostname) && ["http:", "https:"].includes(parsed.protocol) && parsed.origin === origin;
  } catch {
    return false;
  }
}

// nginx overwrites x-real-ip, accepting CF-Connecting-IP only from trusted CF peers.
function visitorIp(request: Request): string | null {
  const ip = request.headers.get("x-real-ip")?.trim();
  if (ip && isIP(ip)) return ip.replace(/^::ffff:(?=\d+\.)/i, "");
  return process.env.NODE_ENV !== "production" ? "127.0.0.1" : null;
}

function json(body: object, status: number, cookie?: string) {
  return NextResponse.json(body, {
    status,
    headers: { "cache-control": "no-store", ...(cookie ? { "set-cookie": cookie } : {}) },
  });
}

function preflight(request: Request) {
  if (!allowedRequest(request)) return { error: json({ error: "forbidden_origin" }, 403) };
  const secret = process.env.WEB_EXPLAIN_SECRET;
  if (!secret || secret.replace(/\s/g, "").length < 32 || !process.env.DATABASE_URL) {
    return { error: json({ error: "preview_disabled" }, 503) };
  }
  const ip = visitorIp(request);
  if (!ip) return { error: json({ error: "untrusted_proxy" }, 403) };
  try {
    const owner = getOwnerFromRequest(request);
    return { secret, ip, owner, cookie: serializeOwnerCookie(owner.ownerId) };
  } catch {
    return { error: json({ error: "preview_disabled" }, 503) };
  }
}

/** Establish ownership before a generation response can be lost. No AI or DB mutation. */
export async function GET(request: Request) {
  const ready = preflight(request);
  if (ready.error) return ready.error;
  return json({ ok: true }, 200, ready.cookie);
}

async function readBody(request: Request): Promise<{ body?: Record<string, unknown>; status?: number }> {
  if (request.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !== "application/json") return { status: 415 };
  const size = request.headers.get("content-length");
  if (size && /^\d+$/.test(size) && Number(size) > MAX_BODY_BYTES) return { status: 413 };
  if (!request.body) return { status: 400 };
  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let bytes = 0;
  let text = "";
  try {
    for (;;) {
      const chunk = await reader.read();
      if (chunk.done) break;
      bytes += chunk.value.byteLength;
      if (bytes > MAX_BODY_BYTES) {
        void reader.cancel().catch(() => {});
        return { status: 413 };
      }
      text += decoder.decode(chunk.value, { stream: true });
    }
    const body: unknown = JSON.parse(text + decoder.decode());
    return body && typeof body === "object" && !Array.isArray(body) ? { body: body as Record<string, unknown> } : { status: 400 };
  } catch {
    return { status: 400 };
  } finally {
    reader.releaseLock();
  }
}

export async function POST(request: Request) {
  const ready = preflight(request);
  if (ready.error) return ready.error;
  const { secret, ip, owner, cookie } = ready;
  if (owner.isNew) return json({ error: "owner_required" }, 403);
  if (burstLimit(ip)) return json({ error: "limit", scope: "busy", retryAfter: 60 }, 429, cookie);
  const parsed = await readBody(request);
  if (!parsed.body) return json({ error: "bad_request" }, parsed.status || 400, cookie);
  const topic = validateTopic(parsed.body.topic);
  if (!topic) return json({ error: "bad_topic" }, 400, cookie);
  const email = validateEmail(parsed.body.email);
  if (!email) return json({ error: "bad_email" }, 400, cookie);

  try {
    await saveSignup({ email, source: "preview", createdAt: new Date().toISOString(), answers: { searched: topic } });
  } catch {
    return json({ error: "preview_unavailable" }, 503, cookie);
  }

  let upstream: Response;
  try {
    const base = (process.env.T2U_API_URL || "https://tubelight.net").replace(/\/+$/, "");
    upstream = await fetch(`${base}/api/web/explain`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-web-explain-secret": secret, "x-visitor-ip": ip },
      body: JSON.stringify({ topic, email, ownerId: owner.ownerId }),
      signal: request.signal,
      cache: "no-store",
    });
  } catch {
    return json({ error: "upstream_unreachable" }, 502, cookie);
  }
  if (!upstream.ok || !upstream.body) {
    const data = await upstream.json().catch(() => null) as { error?: unknown; scope?: unknown } | null;
    if (upstream.status === 429) {
      const scope = ["identity", "ip", "day", "busy"].includes(String(data?.scope)) ? String(data?.scope) : "busy";
      return json({ error: "limit", scope, ...(scope === "busy" ? { retryAfter: 5 } : {}) }, 429, cookie);
    }
    if (upstream.status === 400 && data?.error === "bad_topic") return json({ error: "bad_topic" }, 400, cookie);
    return json({ error: "preview_unavailable" }, [403, 409, 503].includes(upstream.status) ? upstream.status : 502, cookie);
  }
  const headers = new Headers({
    "set-cookie": cookie, "content-type": "application/x-ndjson; charset=utf-8",
    "cache-control": "no-store, no-transform", "x-accel-buffering": "no",
  });
  const replay = upstream.headers.get("x-preview-replay");
  if (replay === "0" || replay === "1") headers.set("x-preview-replay", replay);
  return new Response(upstream.body, { status: 200, headers });
}
