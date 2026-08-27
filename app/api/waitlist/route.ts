import { NextResponse } from "next/server";
import { forwardSignup, isValidEmail, saveSignup, type Signup } from "@/lib/waitlist";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Small in-memory throttle. Resets on redeploy — enough to stop casual abuse.
const hits = new Map<string, number[]>();
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 5;

function rateLimited(key: string): boolean {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(key, recent);
  return recent.length > MAX_PER_WINDOW;
}

export async function POST(request: Request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "local";

  if (rateLimited(ip)) {
    return NextResponse.json(
      { ok: false, error: "Too many requests. Give it a minute and try again." },
      { status: 429 },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: "Malformed request." }, { status: 400 });
  }

  // Honeypot: real people never fill this in.
  if (typeof body.company === "string" && body.company.trim() !== "") {
    return NextResponse.json({ ok: true, message: "You're on the list." });
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!isValidEmail(email)) {
    return NextResponse.json(
      { ok: false, error: "That email doesn't look right — mind checking it?" },
      { status: 400 },
    );
  }

  const signup: Signup = {
    email,
    role: typeof body.role === "string" && body.role.trim() ? body.role.trim().slice(0, 60) : undefined,
    source: typeof body.source === "string" && body.source.trim() ? body.source.trim().slice(0, 40) : "site",
    createdAt: new Date().toISOString(),
  };

  const result = await saveSignup(signup);
  await forwardSignup(signup);

  return NextResponse.json({
    ok: true,
    duplicate: result.duplicate,
    message: result.duplicate ? "You're already on the list — invite is on its way." : "You're on the list.",
  });
}
