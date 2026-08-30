import { NextRequest, NextResponse } from "next/server";
import { verifyBillingPayment } from "@/lib/billing";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderId,
      paymentId,
      signature,
      checkoutId,
      cs,
      email,
    } = body;

    const cleanOrderId = orderId || razorpay_order_id;
    const cleanPaymentId = paymentId || razorpay_payment_id;
    const cleanSignature = signature || razorpay_signature;
    const cleanCs = checkoutId || cs;

    if (!cleanOrderId || !cleanPaymentId || !cleanSignature) {
      return NextResponse.json(
        { ok: false, error: "Missing required payment verification fields." },
        { status: 400 }
      );
    }

    const result = await verifyBillingPayment({
      orderId: cleanOrderId,
      paymentId: cleanPaymentId,
      signature: cleanSignature,
      checkoutId: cleanCs,
      email,
    });

    return NextResponse.json(result);
  } catch (err: any) {
    console.error("[api/billing/verify-payment] Error:", err.message);
    return NextResponse.json(
      { ok: false, error: err.message || "Payment verification failed" },
      { status: 400 }
    );
  }
}
