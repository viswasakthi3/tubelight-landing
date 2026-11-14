import { NextResponse } from "next/server";
import { getPosition } from "@/lib/waitlist";
import { verifyToken } from "@/lib/waitlist-token";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (typeof body?.email !== "string" || !verifyToken(body.email, body.token)) {
    return NextResponse.json({ ok: false }, { status: 403 });
  }
  return NextResponse.json({ position: await getPosition(body.email.trim().toLowerCase()) });
}
