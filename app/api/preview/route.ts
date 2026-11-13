import { NextResponse } from "next/server";
import { makeLimiter } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Burst guard only: the real limits (one per visitor per day, a daily ceiling, concurrency)
// live in the backend, where a restart of this server cannot reset them.
const tooMany = makeLimiter(6, 60_000);

function visitorIp(request: Request): string {
  const h = request.headers;
  return (
    h.get("cf-connecting-ip")?.trim() ||
    h.get("x-real-ip")?.trim() ||
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  );
}

export async function POST(request: Request) {
  const secret = process.env.WEB_EXPLAIN_SECRET;
  if (!secret) return NextResponse.json({ error: "preview_disabled" }, { status: 503 });

  const ip = visitorIp(request);
  if (tooMany(ip)) return NextResponse.json({ error: "limit", scope: "busy" }, { status: 429 });

  let topic: unknown;
  try {
    topic = ((await request.json()) as { topic?: unknown }).topic;
  } catch {
    return NextResponse.json({ error: "bad_topic" }, { status: 400 });
  }
  if (typeof topic !== "string") return NextResponse.json({ error: "bad_topic" }, { status: 400 });

  const base = (process.env.T2U_API_URL ?? "https://tubelight.net").replace(/\/+$/, "");
  let upstream: Response;
  try {
    upstream = await fetch(`${base}/api/web/explain`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-web-explain-secret": secret,
        "x-visitor-ip": ip,
      },
      body: JSON.stringify({ topic }),
      signal: request.signal,
      cache: "no-store",
    });
  } catch {
    return NextResponse.json({ error: "upstream_unreachable" }, { status: 502 });
  }

  if (!upstream.ok || !upstream.body) {
    const text = await upstream.text().catch(() => "");
    return new Response(text || JSON.stringify({ error: "upstream_error" }), {
      status: upstream.status || 502,
      headers: { "content-type": "application/json", "cache-control": "no-store" },
    });
  }

  return new Response(upstream.body, {
    status: 200,
    headers: {
      "content-type": "application/x-ndjson; charset=utf-8",
      "cache-control": "no-store, no-transform",
      "x-accel-buffering": "no",
    },
  });
}
