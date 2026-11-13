import { promises as fs } from "node:fs";
import path from "node:path";
import { Pool } from "pg";
import { SPOTS_PER_ANSWER } from "./waitlist-shared";

export { SPOTS_PER_ANSWER };

export type AnswerValue = string | string[];
export type Answers = Record<string, AnswerValue>;

export type Signup = {
  email: string;
  source: string;
  role?: string;
  createdAt: string;
  answers?: Answers;
  boost?: number;
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
  // Additive only: never drops or rewrites existing data.
  await db.query(
    `ALTER TABLE tubelight_waitlist
       ADD COLUMN IF NOT EXISTS answers JSONB NOT NULL DEFAULT '{}'::jsonb,
       ADD COLUMN IF NOT EXISTS boost INT NOT NULL DEFAULT 0`,
  );
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
        `INSERT INTO tubelight_waitlist (email, role, source, answers)
         VALUES ($1, $2, $3, $4::jsonb)
         ON CONFLICT (email) DO NOTHING
         RETURNING id`,
        [signup.email, signup.role || null, signup.source || "site", JSON.stringify(signup.answers ?? {})],
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

/* ---------- ranking: boost DESC, created_at ASC, id ASC ---------- */

type Queryable = Pick<Pool, "query">;

async function pgPosition(q: Queryable, email: string): Promise<number | null> {
  const me = await q.query<{ id: number; boost: number; created_at: Date }>(
    `SELECT id, boost, created_at FROM tubelight_waitlist WHERE email = $1`,
    [email],
  );
  const row = me.rows[0];
  if (!row) return null;
  const ahead = await q.query<{ n: number }>(
    `SELECT COUNT(*)::int AS n FROM tubelight_waitlist
      WHERE boost > $1
         OR (boost = $1 AND created_at < $2)
         OR (boost = $1 AND created_at = $2 AND id < $3)`,
    [row.boost, row.created_at, row.id],
  );
  return 1 + (ahead.rows[0]?.n ?? 0);
}

function fileRanked(all: Signup[]): { s: Signup; i: number }[] {
  return all
    .map((s, i) => ({ s, i }))
    .sort(
      (a, b) =>
        (b.s.boost ?? 0) - (a.s.boost ?? 0) ||
        Date.parse(a.s.createdAt) - Date.parse(b.s.createdAt) ||
        a.i - b.i,
    );
}

function filePosition(all: Signup[], email: string): number | null {
  const idx = fileRanked(all).findIndex((r) => r.s.email === email);
  return idx < 0 ? null : idx + 1;
}

/** 1 + the number of people ranked ahead of this email, or null if they are not on the list. */
export async function getPosition(email: string): Promise<number | null> {
  const db = getPool();
  if (db) {
    try {
      await ensureTable(db);
      return await pgPosition(db, email);
    } catch (err) {
      console.error("[waitlist] getPosition database error, using local file:", err);
    }
  }
  return filePosition(await readAll(), email);
}

export async function getTotal(): Promise<number> {
  const db = getPool();
  if (db) {
    try {
      await ensureTable(db);
      const r = await db.query<{ n: number }>(`SELECT COUNT(*)::int AS n FROM tubelight_waitlist`);
      return r.rows[0]?.n ?? 0;
    } catch (err) {
      console.error("[waitlist] getTotal database error, using local file:", err);
    }
  }
  return (await readAll()).length;
}

/* ---------- answers ---------- */

/** Only the six questions (keys "0"-"5") count; other keys such as "searched" never move anyone up. */
const QUESTION_KEYS = ["0", "1", "2", "3", "4", "5"];

function countAnswered(answers: Answers): number {
  return QUESTION_KEYS.map((k) => answers[k]).filter((v) => (Array.isArray(v) ? v.length > 0 : typeof v === "string" && v.trim() !== "")).length;
}

/** Boost is always recomputed from the stored answers, so repeats can't inflate it. */
export function boostFor(answers: Answers): number {
  return SPOTS_PER_ANSWER * countAnswered(answers);
}

function roleFrom(answers: Answers): string | null {
  const a = answers["0"];
  return typeof a === "string" && a.trim() ? a.trim().slice(0, 60) : null;
}

export type AnswerResult = { position: number; previousPosition: number; boost: number };

/** answer === null means "skipped": nothing is stored. Returns null if the email isn't on the list. */
export async function saveAnswer(email: string, question: number, answer: AnswerValue | null): Promise<AnswerResult | null> {
  const key = String(question);
  const db = getPool();
  if (db) {
    try {
      await ensureTable(db);
      const client = await db.connect();
      try {
        await client.query("BEGIN");
        const cur = await client.query<{ answers: Answers; boost: number }>(
          `SELECT answers, boost FROM tubelight_waitlist WHERE email = $1 FOR UPDATE`,
          [email],
        );
        if (!cur.rows[0]) {
          await client.query("ROLLBACK");
          return null;
        }
        const previousPosition = (await pgPosition(client, email)) ?? 1;
        if (answer === null) {
          await client.query("COMMIT");
          return { position: previousPosition, previousPosition, boost: cur.rows[0].boost };
        }
        const answers: Answers = { ...(cur.rows[0].answers ?? {}), [key]: answer };
        const boost = boostFor(answers);
        await client.query(
          `UPDATE tubelight_waitlist
              SET answers = $2::jsonb, boost = $3, role = COALESCE($4, role)
            WHERE email = $1`,
          [email, JSON.stringify(answers), boost, question === 0 ? roleFrom(answers) : null],
        );
        const position = (await pgPosition(client, email)) ?? previousPosition;
        await client.query("COMMIT");
        return { position, previousPosition, boost };
      } catch (err) {
        await client.query("ROLLBACK").catch(() => undefined);
        throw err;
      } finally {
        client.release();
      }
    } catch (err) {
      console.error("[waitlist] saveAnswer database error, falling back to local file:", err);
    }
  }

  const all = await readAll();
  const me = all.find((s) => s.email === email);
  if (!me) return null;
  const previousPosition = filePosition(all, email) ?? 1;
  if (answer === null) return { position: previousPosition, previousPosition, boost: me.boost ?? 0 };
  me.answers = { ...(me.answers ?? {}), [key]: answer };
  me.boost = boostFor(me.answers);
  if (question === 0) me.role = roleFrom(me.answers) ?? me.role;
  try {
    await fs.mkdir(path.dirname(FILE), { recursive: true });
    await fs.writeFile(FILE, JSON.stringify(all, null, 2), "utf8");
  } catch {
    return null;
  }
  return { position: filePosition(all, email) ?? previousPosition, previousPosition, boost: me.boost };
}

/* ---------- public stats (cached 60 s) ---------- */

export type WaitlistStats = { total: number; thisWeek: number };
let statsCache: { at: number; value: WaitlistStats } | null = null;

export async function getStats(): Promise<WaitlistStats> {
  if (statsCache && Date.now() - statsCache.at < 60_000) return statsCache.value;
  let value: WaitlistStats | null = null;
  const db = getPool();
  if (db) {
    try {
      await ensureTable(db);
      const r = await db.query<{ total: number; week: number }>(
        `SELECT COUNT(*)::int AS total,
                COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days')::int AS week
           FROM tubelight_waitlist`,
      );
      value = { total: r.rows[0]?.total ?? 0, thisWeek: r.rows[0]?.week ?? 0 };
    } catch (err) {
      console.error("[waitlist] getStats database error, using local file:", err);
    }
  }
  if (!value) {
    const all = await readAll();
    const cutoff = Date.now() - 7 * 24 * 3600 * 1000;
    value = { total: all.length, thisWeek: all.filter((s) => Date.parse(s.createdAt) > cutoff).length };
  }
  statsCache = { at: Date.now(), value };
  return value;
}

export async function forwardSignup(signup: Signup): Promise<void> {
  const tasks: Promise<unknown>[] = [];

  const webhook = process.env.WAITLIST_WEBHOOK_URL;
  if (webhook) {
    tasks.push(
      fetch(webhook, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...signup, answers: undefined }),
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

