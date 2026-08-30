"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Script from "next/script";
import Link from "next/link";
import { Logo } from "@/components/Logo";

interface UserProfile {
  id?: string;
  name?: string;
  email?: string;
}

function UpgradeContent() {
  const searchParams = useSearchParams();
  const cs = searchParams.get("cs") || searchParams.get("ticket") || "";
  const emailParam = searchParams.get("email") || "";

  const [inputEmail, setInputEmail] = useState(emailParam);
  const [inputName, setInputName] = useState("");
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [orderReady, setOrderReady] = useState(false);
  const [orderData, setOrderData] = useState<any>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function initOrder() {
      try {
        setLoading(true);
        // Call local Next.js Route Handler /api/billing/create-order
        const res = await fetch("/api/billing/create-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            checkoutId: cs || undefined,
            email: emailParam || undefined,
            amount: 59900,
          }),
        });

        const data = await res.json();
        if (!isMounted) return;

        if (res.ok && data.ok) {
          setOrderData(data);
          if (data.user?.email) {
            setUser(data.user);
            setInputEmail(data.user.email);
            if (data.user.name) setInputName(data.user.name);
          }
          setOrderReady(true);
        }
      } catch (err: any) {
        console.warn("[upgrade] Order init error:", err.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    initOrder();
    return () => {
      isMounted = false;
    };
  }, [cs, emailParam]);

  const handleStartPayment = async () => {
    const targetEmail = user?.email || inputEmail.trim();
    if (!targetEmail || !targetEmail.includes("@")) {
      alert("Please enter a valid email address for your Tubelight Pro subscription.");
      return;
    }

    setLoading(true);

    let activeOrder = orderData;
    // If order was not prepared or email changed, fetch a fresh order
    if (!activeOrder?.orderId || (!cs && targetEmail !== orderData?.user?.email)) {
      try {
        const res = await fetch("/api/billing/create-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            checkoutId: cs || undefined,
            email: targetEmail,
            amount: 59900,
          }),
        });
        const data = await res.json();
        if (res.ok && data.ok) {
          activeOrder = data;
          setOrderData(data);
        } else {
          alert(data.error || "Could not prepare checkout order.");
          setLoading(false);
          return;
        }
      } catch (err: any) {
        alert("Failed to initialize checkout: " + err.message);
        setLoading(false);
        return;
      }
    }

    const RazorpayConstructor = (window as any).Razorpay;
    if (!RazorpayConstructor) {
      alert("Razorpay payment modal is loading. Please try again in a moment.");
      setLoading(false);
      return;
    }

    const options = {
      key: activeOrder.keyId || activeOrder.key || "rzp_test_TVy6HCZNcxdabp",
      order_id: activeOrder.orderId || activeOrder.order_id,
      amount: activeOrder.amount || 59900,
      currency: activeOrder.currency || "INR",
      name: "Tubelight",
      description: "Tubelight Pro Monthly (100 credits/mo)",
      image: "/brand/icon.png",
      prefill: {
        name: user?.name || inputName || "",
        email: targetEmail,
      },
      readonly: cs
        ? {
            name: true,
            email: true,
            contact: false,
          }
        : undefined,
      theme: {
        color: "#6c4cf1",
      },
      handler: async function (response: any) {
        setVerifying(true);
        try {
          const verifyRes = await fetch("/api/billing/verify-payment", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              orderId: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature,
              checkoutId: cs || undefined,
              email: targetEmail,
            }),
          });

          const verifyData = await verifyRes.json();
          if (verifyRes.ok && verifyData.ok) {
            setPaymentSuccess(true);
            const targetUrl = `tubelight://subscription-success?cs=${encodeURIComponent(cs)}&pay_id=${encodeURIComponent(response.razorpay_payment_id || "")}`;
            try {
              window.location.href = targetUrl;
            } catch (e) {}
          } else {
            alert(verifyData.error || "Payment verification could not be confirmed.");
          }
        } catch (err: any) {
          console.error("Verification error:", err);
          setPaymentSuccess(true);
        } finally {
          setVerifying(false);
          setLoading(false);
        }
      },
      modal: {
        ondismiss: function () {
          setLoading(false);
        },
      },
    };

    const rzp = new RazorpayConstructor(options);
    rzp.on("payment.failed", function (response: any) {
      console.error("Payment failed:", response.error);
      alert(`Payment failed: ${response.error?.description || "Transaction declined"}`);
      setLoading(false);
    });

    setLoading(false);
    rzp.open();
  };

  return (
    <div className="relative min-h-screen bg-paper text-ink flex flex-col justify-between selection:bg-[#cdbcff] selection:text-[#16102b]">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />

      {/* Header */}
      <header className="border-b border-line bg-paper/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
          <Link href="/" className="transition hover:opacity-90">
            <Logo />
          </Link>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-violet bg-violet-soft px-3 py-1.5 rounded-full border border-violet/20">
            <span className="w-2 h-2 rounded-full bg-violet animate-pulse" />
            Tubelight Pro
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-2xl w-full mx-auto px-4 sm:px-6 py-10 sm:py-16">
        {paymentSuccess ? (
          /* Payment Success View */
          <div className="card-paper rounded-2xl p-8 sm:p-12 text-center border border-line shadow-frame animate-in fade-in zoom-in-95 duration-300">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lift">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold font-display tracking-tight text-ink mb-3">
              You&apos;re now on Tubelight Pro!
            </h1>
            <p className="text-base sm:text-lg text-ink-2 mb-8 max-w-md mx-auto">
              Your 100 monthly credits and priority features are active. You can now open Tubelight to start creating visual explanations.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a
                href={`tubelight://subscription-success?cs=${encodeURIComponent(cs)}`}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet hover:bg-violet-2 text-white font-semibold px-6 py-3.5 shadow-lift transition hover:scale-[1.02] active:scale-[0.98]"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                <span>Open Tubelight App</span>
              </a>
              <Link
                href="/"
                className="inline-flex items-center justify-center rounded-xl bg-paper-2 hover:bg-paper-3 text-ink-2 font-medium px-6 py-3.5 border border-line transition"
              >
                Back to Home
              </Link>
            </div>
          </div>
        ) : (
          /* Active Checkout Card */
          <div className="card-paper rounded-2xl p-6 sm:p-10 border border-line shadow-frame">
            <div className="flex items-center justify-between border-b border-line pb-6 mb-6">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-violet">Subscription Plan</span>
                <h1 className="text-2xl sm:text-3xl font-bold font-display text-ink mt-0.5">
                  Tubelight Pro
                </h1>
              </div>
              <div className="text-right">
                <div className="text-2xl sm:text-3xl font-bold text-ink flex items-baseline justify-end gap-1">
                  <span>₹599</span>
                  <span className="text-xs sm:text-sm font-normal text-ink-3">/ month</span>
                </div>
                <div className="text-xs text-ink-3">($9 USD equivalent)</div>
              </div>
            </div>

            {/* Account Details Box */}
            <div className="bg-paper-2 rounded-xl p-4 border border-line mb-6">
              <div className="flex items-center justify-between text-xs text-ink-3 mb-2">
                <span>Account details</span>
                {cs && (
                  <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    Locked to desktop session
                  </span>
                )}
              </div>

              {cs && user?.email ? (
                <div>
                  <div className="text-sm font-semibold text-ink truncate">{user.email}</div>
                  {user.name && <div className="text-xs text-ink-2 mt-0.5">{user.name}</div>}
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-ink-2 mb-1">Email address</label>
                    <input
                      type="email"
                      required
                      placeholder="your.email@example.com"
                      value={inputEmail}
                      onChange={(e) => setInputEmail(e.target.value)}
                      className="w-full bg-white border border-line rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:border-violet"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-ink-2 mb-1">Name (optional)</label>
                    <input
                      type="text"
                      placeholder="Your Name"
                      value={inputName}
                      onChange={(e) => setInputName(e.target.value)}
                      className="w-full bg-white border border-line rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:border-violet"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Perks Grid */}
            <div className="space-y-3 mb-8">
              <div className="flex items-start gap-3 text-sm text-ink-2">
                <div className="w-5 h-5 rounded-full bg-violet-soft text-violet flex items-center justify-center shrink-0 mt-0.5">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <strong className="text-ink">100 monthly credits</strong> (100 Fast, 50 Balanced, or 33 Rich visual explanations).
                </div>
              </div>

              <div className="flex items-start gap-3 text-sm text-ink-2">
                <div className="w-5 h-5 rounded-full bg-violet-soft text-violet flex items-center justify-center shrink-0 mt-0.5">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <strong className="text-ink">Longer context</strong> — select and paste large articles with full memory.
                </div>
              </div>

              <div className="flex items-start gap-3 text-sm text-ink-2">
                <div className="w-5 h-5 rounded-full bg-violet-soft text-violet flex items-center justify-center shrink-0 mt-0.5">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <strong className="text-ink">Smarter voices & beta models</strong> — first access to high-fidelity narration.
                </div>
              </div>

              <div className="flex items-start gap-3 text-sm text-ink-2">
                <div className="w-5 h-5 rounded-full bg-violet-soft text-violet flex items-center justify-center shrink-0 mt-0.5">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <strong className="text-ink">Instant activation</strong> — syncs automatically with your desktop app.
                </div>
              </div>
            </div>

            {/* Pay Button */}
            <button
              onClick={handleStartPayment}
              disabled={loading || verifying}
              className="w-full bg-violet hover:bg-violet-2 active:scale-[0.99] text-white font-semibold py-4 px-6 rounded-xl shadow-lift transition flex items-center justify-center gap-2 text-base cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {verifying ? (
                <span>Verifying Payment...</span>
              ) : loading ? (
                <span>Preparing Secure Checkout...</span>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <span>Proceed to Payment — ₹599 / month</span>
                </>
              )}
            </button>

            <div className="mt-4 flex items-center justify-center gap-2 text-xs text-ink-3">
              <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span>Secured by Razorpay • UPI, Cards, NetBanking</span>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-line py-6 text-center text-xs text-ink-3">
        <p>© 2026 Tubelight. All payments are processed securely via Razorpay.</p>
      </footer>
    </div>
  );
}

export default function UpgradePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-paper flex items-center justify-center text-ink-3">Loading checkout...</div>}>
      <UpgradeContent />
    </Suspense>
  );
}
