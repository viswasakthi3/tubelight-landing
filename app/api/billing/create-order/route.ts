import { NextRequest, NextResponse } from "next/server";
import { createBillingOrder } from "@/lib/billing";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { checkoutId, cs, ticket, email, amount = 59900, currency = "INR" } = body;
    const sessionCs = checkoutId || cs || ticket;

    const result = await createBillingOrder({
      checkoutId: sessionCs,
      email,
      amount,
      currency,
    });

    return NextResponse.json(result);
  } catch (err: any) {
    console.error("[api/billing/create-order] Error:", err.message);
    return NextResponse.json(
      { ok: false, error: err.message || "Failed to create order" },
      { status: 500 }
    );
  }
}
