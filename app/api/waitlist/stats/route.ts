import { NextResponse } from "next/server";
import { getStats } from "@/lib/waitlist";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const { total, thisWeek } = await getStats(); // cached in memory for 60 s
  const min = Number(process.env.WAITLIST_SHOW_MIN ?? 100);
  // `show` tells the page whether the real count is big enough to display.
  return NextResponse.json({ total, thisWeek, show: total >= (Number.isFinite(min) ? min : 100) });
}
