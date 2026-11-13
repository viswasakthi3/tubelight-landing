import { NextResponse } from "next/server";
import { isValidEmail, saveAnswer, type AnswerValue } from "@/lib/waitlist";
import { verifyToken } from "@/lib/waitlist-token";
import { clientIp, makeLimiter } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const limited = makeLimiter(30);
const MAX_LEN = 200;
const MAX_ITEMS = 8;

/** Returns the cleaned answer, null for "skipped / empty", or undefined when invalid. */
function cleanAnswer(raw: unknown): AnswerValue | null | undefined {
  if (raw === null || raw === undefined) return null;
  if (typeof raw === "string") {
    const s = raw.trim();
    if (s.length > MAX_LEN) return undefined;
    return s === "" ? null : s;
  }
  if (Array.isArray(raw)) {
    if (raw.length > MAX_ITEMS) return undefined;
    const out: string[] = [];
    for (const item of raw) {
      if (typeof item !== "string") return undefined;
      const s = item.trim();
      if (s.length > MAX_LEN) return undefined;
      if (s) out.push(s);
    }
    return out.length ? out : null;
  }
  return undefined;
}

export async function POST(request: Request) {
  if (limited(clientIp(request))) {
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

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!isValidEmail(email) || !verifyToken(email, body.token)) {
    return NextResponse.json({ ok: false, error: "Not allowed." }, { status: 403 });
  }

  const q = body.question;
  if (typeof q !== "number" || !Number.isInteger(q) || q < 0 || q > 5) {
    return NextResponse.json({ ok: false, error: "Unknown question." }, { status: 400 });
  }

  const answer = cleanAnswer(body.answer);
  if (answer === undefined) {
    return NextResponse.json({ ok: false, error: "That answer is too long." }, { status: 400 });
  }

  const result = await saveAnswer(email, q, answer);
  if (!result) {
    return NextResponse.json({ ok: false, error: "Couldn't save that." }, { status: 404 });
  }
  return NextResponse.json({ ok: true, ...result });
}
