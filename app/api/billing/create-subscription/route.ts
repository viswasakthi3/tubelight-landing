import { NextRequest, NextResponse } from "next/server";
import { createBillingSubscription } from "@/lib/billing";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { checkoutId, cs, ticket, email, planId, plan } = body;
    const sessionCs = checkoutId || cs || ticket;

    const result = await createBillingSubscription({
      checkoutId: sessionCs,
      email,
      planId,
      plan,
    });

    return NextResponse.json(result);
  } catch (err: any) {
    console.error("[api/billing/create-subscription] Error:", err.message);
    return NextResponse.json(
      { ok: false, error: err.message || "Failed to create subscription" },
      { status: 500 }
    );
  }
}
