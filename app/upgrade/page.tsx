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

const PLANS = {
  boost_55: {
    id: "boost_55",
    name: "55 Credits Pack",
    badge: "Instant Top-up",
    priceInr: 300,
    priceUsd: 4,
    amountPaise: 30000,
    period: "one-time",
    credits: 55,
    mix: "55 Fast / 27 Balanced / 18 Rich",
    description: "Tubelight 55 Credits Pack (55 Fast, 27 Balanced, or 18 Rich explanations)",
    perks: [
      {
        title: "55 credits added immediately",
        body: "Instantly available for fast, balanced, or rich deck visual explanations.",
      },
      {
        title: "Never expires until spent",
        body: "Use your credits at your own pace whenever you need visual stories.",
      },
      {
        title: "Full access to all models & narration",
        body: "Access high-fidelity diagram generation, Gemini 3 Pro reasoning, and voices.",
      },
      {
        title: "Instant desktop sync",
        body: "Immediately reflects in your Tubelight desktop app without restarting.",
      },
    ],
  },
  pro: {
    id: "pro",
    name: "Tubelight Pro",
    badge: "Monthly Plan",
    priceInr: 599,
    priceUsd: 9,
    amountPaise: 59900,
    period: "month",
    credits: 100,
    mix: "100 Fast / 50 Balanced / 33 Rich",
    description: "Tubelight Pro Monthly (100 credits/mo)",
    perks: [
      {
        title: "100 monthly credits",
        body: "100 Fast, 50 Balanced, or 33 Rich visual explanations refilled every month.",
      },
      {
        title: "Longer context memory",
        body: "Select and paste large articles and maintain full story context.",
      },
      {
        title: "Smarter voices & beta models",
        body: "First access to highest fidelity narration and experimental visual engines.",
      },
      {
        title: "Instant activation & priority",
        body: "Syncs automatically with your desktop app session with priority support.",
      },
    ],
  },
  max: {
    id: "max",
    name: "Tubelight Max",
    badge: "Power Plan",
    priceInr: 1999,
    priceUsd: 27,
    amountPaise: 199900,
    period: "month",
    credits: 375,
    mix: "375 Fast / 187 Balanced / 125 Rich",
    description: "Tubelight Max Monthly (375 credits/mo)",
    perks: [
      {
        title: "375 monthly credits",
        body: "375 Fast, 187 Balanced, or 125 Rich visual explanations refilled every month.",
      },
      {
        title: "2× Faster Rendering",
        body: "Priority processing queues on our fastest GPU clusters for instant results.",
      },
      {
        title: "Longest context memory",
        body: "Select and paste entire articles, books, and maintain full story context.",
      },
      {
        title: "Every voice & beta model",
        body: "First access to highest fidelity neural narration and experimental visual engines.",
      },
      {
        title: "Instant activation & VIP priority",
        body: "Syncs automatically with your desktop app session with priority support.",
      },
    ],
  },
} as const;

type PlanKey = keyof typeof PLANS;

function UpgradeContent() {
  const searchParams = useSearchParams();
  const cs = searchParams.get("cs") || searchParams.get("ticket") || "";
  const emailParam = searchParams.get("email") || "";
  const initialPlanParam = searchParams.get("plan");
  const initialPlan: PlanKey =
    initialPlanParam === "max"
      ? "max"
      : initialPlanParam === "boost_55" || initialPlanParam === "half"
      ? "boost_55"
      : "pro";

  const [selectedPlan, setSelectedPlan] = useState<PlanKey>(initialPlan);
  const [inputEmail, setInputEmail] = useState(emailParam);
  const [inputName, setInputName] = useState("");
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [orderData, setOrderData] = useState<any>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const activePlanInfo = PLANS[selectedPlan];

  useEffect(() => {
    if (initialPlanParam === "max") {
      setSelectedPlan("max");
    } else if (initialPlanParam === "boost_55" || initialPlanParam === "half") {
      setSelectedPlan("boost_55");
    } else if (initialPlanParam === "pro") {
      setSelectedPlan("pro");
    }
  }, [initialPlanParam]);

  useEffect(() => {
    let isMounted = true;

    async function initOrder() {
      try {
        setLoading(true);
        const isRecurring = selectedPlan === "pro" || selectedPlan === "max";
        const endpoint = isRecurring ? "/api/billing/create-subscription" : "/api/billing/create-order";
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            checkoutId: cs || undefined,
            email: emailParam || undefined,
            amount: activePlanInfo.amountPaise,
            plan: selectedPlan,
          }),
        });

        const data = await res.json();
        if (!isMounted) return;

        if (res.ok && data.ok) {
          setOrderData(data);
          if (data.plan === "max") {
            setSelectedPlan("max");
          } else if (data.plan === "boost_55" || data.plan === "half") {
            setSelectedPlan("boost_55");
          } else if (data.plan === "pro") {
            setSelectedPlan("pro");
          }
          if (data.user?.email) {
            setUser(data.user);
            setInputEmail(data.user.email);
            if (data.user.name) setInputName(data.user.name);
          }
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
  }, [cs, emailParam, selectedPlan]);

  const handleStartPayment = async () => {
    const targetEmail = user?.email || inputEmail.trim();
    if (!targetEmail || !targetEmail.includes("@")) {
      alert("Please enter a valid email address for your Tubelight credits purchase.");
      return;
    }

    setLoading(true);

    const isRecurring = selectedPlan === "pro" || selectedPlan === "max";
    let activeOrder = orderData;
    const hasValidOrder = isRecurring
      ? Boolean(activeOrder?.subscriptionId || activeOrder?.subscription_id)
      : Boolean(activeOrder?.orderId || activeOrder?.order_id);

    if (!hasValidOrder || activeOrder?.plan !== selectedPlan || (!cs && targetEmail !== orderData?.user?.email)) {
      try {
        const endpoint = isRecurring ? "/api/billing/create-subscription" : "/api/billing/create-order";
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            checkoutId: cs || undefined,
            email: targetEmail,
            amount: activePlanInfo.amountPaise,
            plan: selectedPlan,
          }),
        });
        const data = await res.json();
        if (res.ok && data.ok) {
          activeOrder = data;
          setOrderData(data);
        } else {
          alert(data.error || "Could not prepare checkout.");
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

    const razorpayKey = activeOrder.keyId || activeOrder.key || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    if (!razorpayKey) {
      alert("Checkout is not available right now (payment key is not configured).");
      setLoading(false);
      return;
    }

    const options: any = {
      key: razorpayKey,
      name: "Tubelight",
      description: activePlanInfo.description,
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
              orderId: response.razorpay_order_id || response.razorpay_subscription_id,
              subscriptionId: response.razorpay_subscription_id,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature,
              checkoutId: cs || undefined,
              email: targetEmail,
              plan: selectedPlan,
            }),
          });

          const verifyData = await verifyRes.json();
          if (verifyRes.ok && verifyData.ok) {
            setPaymentSuccess(true);
            const targetUrl = `tubelight://subscription-success?cs=${encodeURIComponent(cs)}&plan=${encodeURIComponent(selectedPlan)}&pay_id=${encodeURIComponent(response.razorpay_payment_id || "")}`;
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

    if (isRecurring) {
      options.subscription_id = activeOrder.subscriptionId || activeOrder.subscription_id;
    } else {
      options.order_id = activeOrder.orderId || activeOrder.order_id;
      options.amount = activeOrder.amount || activePlanInfo.amountPaise;
      options.currency = activeOrder.currency || "INR";
    }

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
            {selectedPlan === "boost_55" ? "55 Credits Top-up" : selectedPlan === "max" ? "Tubelight Max (375 Cr)" : "Tubelight Pro (100 Cr)"}
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
              {selectedPlan === "boost_55"
                ? "55 Credits Added!"
                : selectedPlan === "max"
                ? "You're now on Tubelight Max!"
                : "You're now on Tubelight Pro!"}
            </h1>
            <p className="text-base sm:text-lg text-ink-2 mb-8 max-w-md mx-auto">
              {selectedPlan === "boost_55"
                ? "55 credits have been added to your balance. Open Tubelight to continue creating visual explanations."
                : selectedPlan === "max"
                ? "Your 375 monthly credits and 2× faster rendering features are active. Open Tubelight to start creating visual explanations."
                : "Your 100 monthly credits and priority features are active. Open Tubelight to start creating visual explanations."}
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a
                href={`tubelight://subscription-success?cs=${encodeURIComponent(cs)}&plan=${encodeURIComponent(selectedPlan)}`}
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
            {/* Plan Selector Toggle */}
            <div className="grid grid-cols-1 sm:grid-cols-3 bg-paper-2 p-1.5 rounded-xl border border-line mb-8 gap-1.5">
              <button
                type="button"
                onClick={() => setSelectedPlan("boost_55")}
                className={`py-3 px-2 rounded-lg text-xs sm:text-sm font-semibold transition flex flex-col items-center justify-center gap-1 ${
                  selectedPlan === "boost_55"
                    ? "bg-white text-ink shadow-sm border border-line/80 font-bold"
                    : "text-ink-2 hover:text-ink hover:bg-white/50"
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <span>55 Credits Pack</span>
                  <span className="text-[10px] uppercase tracking-wider bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold">
                    Save
                  </span>
                </span>
                <span className="text-xs text-ink-3">₹300 / $4 (one-time)</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedPlan("pro")}
                className={`py-3 px-2 rounded-lg text-xs sm:text-sm font-semibold transition flex flex-col items-center justify-center gap-1 ${
                  selectedPlan === "pro"
                    ? "bg-white text-ink shadow-sm border border-line/80 font-bold"
                    : "text-ink-2 hover:text-ink hover:bg-white/50"
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <span>Tubelight Pro (100 Cr)</span>
                  <span className="text-[10px] uppercase tracking-wider bg-violet-soft text-violet px-1.5 py-0.5 rounded font-bold">
                    Popular
                  </span>
                </span>
                <span className="text-xs text-ink-3">₹599 / $9 a month</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedPlan("max")}
                className={`py-3 px-2 rounded-lg text-xs sm:text-sm font-semibold transition flex flex-col items-center justify-center gap-1 ${
                  selectedPlan === "max"
                    ? "bg-white text-ink shadow-sm border border-line/80 font-bold ring-1 ring-violet"
                    : "text-ink-2 hover:text-ink hover:bg-white/50"
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <span>Tubelight Max (375 Cr)</span>
                  <span className="text-[10px] uppercase tracking-wider bg-violet text-white px-1.5 py-0.5 rounded font-bold">
                    Power
                  </span>
                </span>
                <span className="text-xs text-ink-3">₹1,999 / $27 a month</span>
              </button>
            </div>

            <div className="flex items-center justify-between border-b border-line pb-6 mb-6">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-violet">
                  {activePlanInfo.badge}
                </span>
                <h1 className="text-2xl sm:text-3xl font-bold font-display text-ink mt-0.5">
                  {activePlanInfo.name}
                </h1>
                <p className="text-xs text-ink-3 mt-1">{activePlanInfo.mix}</p>
              </div>
              <div className="text-right">
                <div className="text-2xl sm:text-3xl font-bold text-ink flex items-baseline justify-end gap-1">
                  <span>₹{activePlanInfo.priceInr}</span>
                  <span className="text-xs sm:text-sm font-normal text-ink-3">
                    {activePlanInfo.period === "one-time" ? " once" : " / month"}
                  </span>
                </div>
                <div className="text-xs text-ink-3">(${activePlanInfo.priceUsd} USD equivalent)</div>
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
              {activePlanInfo.perks.map((perk, idx) => (
                <div key={idx} className="flex items-start gap-3 text-sm text-ink-2">
                  <div className="w-5 h-5 rounded-full bg-violet-soft text-violet flex items-center justify-center shrink-0 mt-0.5">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <strong className="text-ink">{perk.title}</strong> — {perk.body}
                  </div>
                </div>
              ))}
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
                  <span>
                    Proceed to Payment — ₹{activePlanInfo.priceInr} ({activePlanInfo.credits} Credits)
                  </span>
                </>
              )}
            </button>

            <div className="mt-4 flex items-center justify-center gap-2 text-xs text-ink-3">
              <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span>Secured by Razorpay • UPI, Cards, NetBanking</span>
            </div>

            {selectedPlan === "boost_55" && (
              <div className="mt-3 text-center">
                <a
                  href="https://rzp.io/rzp/UR0ZLGd"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-violet hover:underline font-medium inline-flex items-center gap-1"
                >
                  <span>Or pay via Direct Razorpay Hosted Link</span>
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
            )}
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
