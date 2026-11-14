import { NextResponse } from "next/server";
import { getStats } from "@/lib/waitlist";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const { total, thisWeek } = await getStats(); // cached in memory for 60 s
  return NextResponse.json({ total, thisWeek, show: total > 0 });
}
