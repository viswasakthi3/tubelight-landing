import { promises as fs } from "node:fs";
import path from "node:path";
import { Pool } from "pg";

export type Signup = {
  email: string;
  source: string;
  role?: string;
  createdAt: string;
};

const FILE = path.join(process.cwd(), "data", "waitlist.json");

let pool: Pool | null = null;
let tableInitialized = false;

function getPool(): Pool | null {
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

async function ensureTable(db: Pool): Promise<void> {
  if (tableInitialized) return;
  await db.query(`
    CREATE TABLE IF NOT EXISTS tubelight_waitlist (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) NOT NULL UNIQUE,
      role VARCHAR(100),
      source VARCHAR(100) DEFAULT 'site',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_tubelight_waitlist_email ON tubelight_waitlist(email);
  `);
  tableInitialized = true;
}

/**
 * Local JSON storage fallback.
 */
async function readAll(): Promise<Signup[]> {
  try {
    const raw = await fs.readFile(FILE, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Signup[]) : [];
  } catch {
    return [];
  }
}

export async function saveSignup(signup: Signup): Promise<{ stored: boolean; duplicate: boolean; total: number }> {
  const db = getPool();
  if (db) {
    try {
      await ensureTable(db);
      const insertRes = await db.query(
        `INSERT INTO tubelight_waitlist (email, role, source)
         VALUES ($1, $2, $3)
         ON CONFLICT (email) DO NOTHING
         RETURNING id`,
        [signup.email, signup.role || null, signup.source || "site"],
      );
      const duplicate = (insertRes.rowCount ?? 0) === 0;
      const countRes = await db.query<{ count: number }>(`SELECT COUNT(*)::int AS count FROM tubelight_waitlist`);
      const total = countRes.rows[0]?.count ?? 0;
      return { stored: true, duplicate, total };
    } catch (err) {
      console.error("[waitlist] Database query error, falling back to local file:", err);
    }
  }

  try {
    const all = await readAll();
    const duplicate = all.some((s) => s.email === signup.email);
    if (!duplicate) all.push(signup);
    await fs.mkdir(path.dirname(FILE), { recursive: true });
    await fs.writeFile(FILE, JSON.stringify(all, null, 2), "utf8");
    return { stored: true, duplicate, total: all.length };
  } catch {
    return { stored: false, duplicate: false, total: 0 };
  }
}

export async function forwardSignup(signup: Signup): Promise<void> {
  const tasks: Promise<unknown>[] = [];

  const webhook = process.env.WAITLIST_WEBHOOK_URL;
  if (webhook) {
    tasks.push(
      fetch(webhook, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(signup),
      }).catch(() => undefined),
    );
  }

  const resendKey = process.env.RESEND_API_KEY;
  const notifyTo = process.env.WAITLIST_NOTIFY_TO;
  if (resendKey && notifyTo) {
    tasks.push(
      fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          authorization: `Bearer ${resendKey}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          from: process.env.WAITLIST_NOTIFY_FROM ?? "Tubelight <onboarding@resend.dev>",
          to: [notifyTo],
          subject: `Tubelight beta request — ${signup.email}`,
          text: [
            `Email:  ${signup.email}`,
            signup.role ? `Role:   ${signup.role}` : null,
            `Source: ${signup.source}`,
            `When:   ${signup.createdAt}`,
          ]
            .filter(Boolean)
            .join("\n"),
        }),
      }).catch(() => undefined),
    );
  }

  await Promise.all(tasks);
}

/** Deliberately permissive — just enough to catch typos, not to police addresses. */
export function isValidEmail(value: string): boolean {
  if (value.length > 254) return false;
  return /^[^\s@,;]+@[^\s@,;.]+(\.[^\s@,;.]+)+$/.test(value);
}

