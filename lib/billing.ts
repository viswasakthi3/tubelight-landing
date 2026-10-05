import { createHmac, timingSafeEqual, randomBytes } from "node:crypto";
import { Pool } from "pg";
import Razorpay from "razorpay";

let pool: Pool | null = null;

export function getPool(): Pool | null {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) return null;
  if (!pool) {
    pool = new Pool({
      connectionString,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });
  }
  return pool;
}

export function getRazorpayKeyId(): string {
  const keyId = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  if (!keyId) {
    throw new Error("RAZORPAY_KEY_ID is not configured.");
  }
  return keyId;
}

export function getRazorpayClient(): Razorpay | null {
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;
  if (!key_id || !key_secret) return null;
  return new Razorpay({ key_id, key_secret });
}

export async function createBillingOrder({
  checkoutId,
  email,
  amount,
  currency = "INR",
  plan = "pro",
}: {
  checkoutId?: string;
  email?: string;
  amount?: number;
  currency?: string;
  plan?: string;
}) {
  const isMax = plan === "max";
  const isBoost = plan === "boost_55" || plan === "half";
  const defaultAmount = isMax ? 199900 : (isBoost ? 30000 : 59900);
  const cleanAmount = Math.max(100, Math.round(Number(amount) || defaultAmount));
  const cleanPlan = isMax ? "max" : (isBoost ? "boost_55" : "pro");
  const planCredits = isMax ? 375 : (isBoost ? 55 : 100);
  const db = getPool();
  const rzp = getRazorpayClient();

  let userRecord: { id?: string; email?: string; name?: string; deviceId?: string } = {
    email: email || "",
  };

  let sessionCs = checkoutId;

  if (db && sessionCs) {
    try {
      const { rows } = await db.query(
        `SELECT c.id, c.user_id, c.device_id, c.email, c.plan, c.status, c.expires_at,
                u.name, u.username
           FROM t2u_checkout_sessions c
           JOIN t2u_users u ON u.id = c.user_id
          WHERE c.id = $1`,
        [sessionCs]
      );
      if (rows[0]) {
        userRecord = {
          id: rows[0].user_id,
          deviceId: rows[0].device_id,
          email: rows[0].email || email,
          name: rows[0].name || rows[0].username,
        };
      }
    } catch (e) {
      console.warn("[billing] Could not read checkout session from DB:", e);
    }
  }

  // Create order on Razorpay
  let orderId = `order_mock_${randomBytes(8).toString("hex")}`;
  if (rzp) {
    try {
      const receiptId = (sessionCs || `rcpt_${Date.now()}`).slice(0, 40);
      const order = await rzp.orders.create({
        amount: cleanAmount,
        currency,
        receipt: receiptId,
        notes: {
          csId: sessionCs || "",
          plan: cleanPlan,
          email: userRecord.email || "",
          userId: userRecord.id || "",
          deviceId: userRecord.deviceId || "",
          source: "tubelight_net_upgrade",
        },
      });
      orderId = order.id;
    } catch (err: any) {
      console.error("[billing] Razorpay order creation failed:", err.message);
    }
  }

  if (db && sessionCs) {
    try {
      await db.query(
        `UPDATE t2u_checkout_sessions SET provider = 'razorpay', provider_ref = $2, plan = $3 WHERE id = $1`,
        [sessionCs, orderId, cleanPlan]
      );
    } catch (e) {}
  }

  return {
    ok: true,
    orderId,
    order_id: orderId,
    amount: cleanAmount,
    currency,
    plan: cleanPlan,
    credits: planCredits,
    keyId: getRazorpayKeyId(),
    user: userRecord,
    checkoutId: sessionCs,
  };
}

export async function createBillingSubscription({
  checkoutId,
  email,
  planId,
  plan,
}: {
  checkoutId?: string;
  email?: string;
  planId?: string;
  plan?: string;
}) {
  const db = getPool();
  const rzp = getRazorpayClient();

  let userRecord: { id?: string; email?: string; name?: string; deviceId?: string } = {
    email: email || "",
  };

  let sessionCs = checkoutId;
  let sessionPlan = plan || "pro";

  if (db && sessionCs) {
    try {
      const { rows } = await db.query(
        `SELECT c.id, c.user_id, c.device_id, c.email, c.plan, c.status, c.expires_at,
                u.name, u.username
           FROM t2u_checkout_sessions c
           JOIN t2u_users u ON u.id = c.user_id
          WHERE c.id = $1`,
        [sessionCs]
      );
      if (rows[0]) {
        userRecord = {
          id: rows[0].user_id,
          deviceId: rows[0].device_id,
          email: rows[0].email || email,
          name: rows[0].name || rows[0].username,
        };
        if (rows[0].plan) {
          sessionPlan = rows[0].plan;
        }
      }
    } catch (e) {
      console.warn("[billing] Could not read checkout session from DB:", e);
    }
  }

  const isMax = sessionPlan === "max";
  const defaultPlanId = isMax
    ? (process.env.RAZORPAY_MAX_PLAN_ID || "plan_TcnNKaWjw0CvPr")
    : (process.env.RAZORPAY_PLAN_ID || "plan_TbyD2peyeHtfSt");
  const targetPlanId = planId || defaultPlanId;

  let subscriptionId = `sub_mock_${randomBytes(8).toString("hex")}`;
  if (rzp) {
    try {
      const sub = await rzp.subscriptions.create({
        plan_id: targetPlanId,
        total_count: 12, // 1 year / 12 monthly auto-debits
        quantity: 1,
        customer_notify: 1,
        notes: {
          csId: sessionCs || "",
          plan: sessionPlan,
          email: userRecord.email || "",
          userId: userRecord.id || "",
          deviceId: userRecord.deviceId || "",
          source: "tubelight_net_upgrade",
        },
      });
      subscriptionId = sub.id;
    } catch (err: any) {
      console.error("[billing] Razorpay subscription creation failed:", err.message);
    }
  }

  if (db && sessionCs) {
    try {
      await db.query(
        `UPDATE t2u_checkout_sessions SET provider = 'razorpay', provider_ref = $2, plan = $3 WHERE id = $1`,
        [sessionCs, subscriptionId, sessionPlan]
      );
    } catch (e) {}
  }

  return {
    ok: true,
    subscriptionId,
    subscription_id: subscriptionId,
    planId: targetPlanId,
    plan: sessionPlan,
    credits: isMax ? 375 : 100,
    keyId: getRazorpayKeyId(),
    user: userRecord,
    checkoutId: sessionCs,
  };
}

export async function verifyBillingPayment({
  orderId,
  paymentId,
  signature,
  checkoutId,
  email,
  plan,
}: {
  orderId: string;
  paymentId: string;
  signature: string;
  checkoutId?: string;
  email?: string;
  plan?: string;
}) {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) {
    throw new Error("RAZORPAY_KEY_SECRET is not configured.");
  }

  const expected = createHmac("sha256", secret).update(`${orderId}|${paymentId}`).digest("hex");
  const a = Buffer.from(signature.trim(), "utf8");
  const b = Buffer.from(expected, "utf8");

  let matches = a.length === b.length && timingSafeEqual(a, b);
  if (!matches) {
    // For subscriptions, format is payment_id + "|" + subscription_id
    const subExpected = createHmac("sha256", secret).update(`${paymentId}|${orderId}`).digest("hex");
    const bSub = Buffer.from(subExpected, "utf8");
    matches = a.length === bSub.length && timingSafeEqual(a, bSub);
  }

  if (!matches) {
    throw new Error("Payment signature verification failed.");
  }

  const db = getPool();
  let sessionPlan = plan || "pro";

  if (db) {
    try {
      let targetUserId = "";
      let targetEmail = email || "";
      let targetDeviceId = "";

      if (checkoutId) {
        const { rows } = await db.query(
          `UPDATE t2u_checkout_sessions
              SET status = 'paid', provider = 'razorpay', provider_ref = $2, redeemed_at = now()
            WHERE id = $1
            RETURNING user_id, device_id, email, plan`,
          [checkoutId, paymentId]
        );
        if (rows[0]) {
          targetUserId = rows[0].user_id;
          targetDeviceId = rows[0].device_id;
          targetEmail = rows[0].email || targetEmail;
          sessionPlan = rows[0].plan || sessionPlan;
        }
      }

      const isMax = sessionPlan === "max";
      const isBoost = sessionPlan === "boost_55" || sessionPlan === "half";
      const targetCredits = isMax ? 375 : 100;
      const cleanPlan = isMax ? "max" : (isBoost ? "boost_55" : "pro");

      if (isBoost) {
        // Grant 55 credits pack
        if (targetDeviceId) {
          await db.query(
            `UPDATE t2u_devices
                SET custom_limit = GREATEST(COALESCE(custom_limit, 5), COALESCE((SELECT used FROM t2u_usage_daily WHERE device_id = $1 ORDER BY day DESC LIMIT 1), 0)) + 55,
                    boosted_at   = now()
              WHERE device_id = $1`,
            [targetDeviceId]
          );
        }
        if (targetEmail) {
          await db.query(
            `UPDATE t2u_devices
                SET custom_limit = GREATEST(COALESCE(custom_limit, 5), COALESCE((SELECT used FROM t2u_usage_daily WHERE device_id = t2u_devices.device_id ORDER BY day DESC LIMIT 1), 0)) + 55,
                    boosted_at   = now()
              WHERE lower(email) = lower($1) AND ($2::text IS NULL OR device_id <> $2)`,
            [targetEmail.trim(), targetDeviceId || null]
          );
        }
      } else {
        // Grant Pro or Max Tier
        if (targetUserId) {
          await db.query(`UPDATE t2u_users SET tier = 'pro', plan = $2, updated_at = now() WHERE id = $1`, [targetUserId, cleanPlan]);
        }
        if (targetEmail) {
          await db.query(`UPDATE t2u_users SET tier = 'pro', plan = $2, updated_at = now() WHERE lower(email) = lower($1)`, [
            targetEmail.trim(), cleanPlan
          ]);
          await db.query(
            `UPDATE t2u_devices SET tier = 'pro', plan = $3, custom_limit = $2, boosted_at = now() WHERE lower(email) = lower($1)`,
            [targetEmail.trim(), targetCredits, cleanPlan]
          );
        }
        if (targetDeviceId) {
          await db.query(
            `UPDATE t2u_devices SET tier = 'pro', plan = $3, custom_limit = $2, boosted_at = now() WHERE device_id = $1`,
            [targetDeviceId, targetCredits, cleanPlan]
          );
        }
      }
    } catch (dbErr: any) {
      console.error("[billing] Error granting credits in database:", dbErr.message);
    }
  }

  const isMax = sessionPlan === "max";
  const isBoost = sessionPlan === "boost_55" || sessionPlan === "half";

  return {
    ok: true,
    verified: true,
    plan: isMax ? "max" : (isBoost ? "boost_55" : "pro"),
    tier: isBoost ? "free" : "pro",
    credits: isMax ? 375 : (isBoost ? 55 : 100),
    orderId,
    paymentId
  };
}
