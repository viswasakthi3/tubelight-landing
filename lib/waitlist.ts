import { promises as fs } from "node:fs";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { Pool } from "pg";
import { PRIORITY_POINTS } from "./waitlist-shared";

export { PRIORITY_POINTS };

export type AnswerValue = string | string[];
export type Answers = Record<string, AnswerValue>;

export type Signup = {
  email: string;
  source: string;
  role?: string;
  createdAt: string;
  answers?: Answers;
  boost?: number;
  referralCode?: string;
  referrals?: number;
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
       ADD COLUMN IF NOT EXISTS boost INT NOT NULL DEFAULT 0,
       ADD COLUMN IF NOT EXISTS referral_code UUID,
       ADD COLUMN IF NOT EXISTS referrals INT NOT NULL DEFAULT 0`,
  );
  await db.query("CREATE UNIQUE INDEX IF NOT EXISTS idx_waitlist_referral ON tubelight_waitlist(referral_code)");
  tableInitialized = true;
}

/**
 * Local JSON storage fallback.
 */
async function readAll(): Promise<Signup[]> {
  try {
    const raw = await fs.readFile(FILE, "utf8");
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) throw new Error("Invalid waitlist file");
    return parsed as Signup[];
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
}

let fileQueue: Promise<unknown> = Promise.resolve();
function fileMutation<T>(work: () => Promise<T>): Promise<T> {
  const pending = fileQueue.then(work);
  fileQueue = pending.catch(() => undefined);
  return pending;
}

async function writeAll(all: Signup[]) {
  await fs.mkdir(path.dirname(FILE), { recursive: true });
  const temp = FILE + "." + randomUUID();
  await fs.writeFile(temp, JSON.stringify(all, null, 2), "utf8");
  await fs.rename(temp, FILE);
}

export async function saveSignup(signup: Signup, ref: string | null = null) {
  const code = randomUUID();
  const db = getPool();
  if (db) {
    await ensureTable(db);
    const client = await db.connect();
    try {
      await client.query("BEGIN");
      const inserted = await client.query(
        `INSERT INTO tubelight_waitlist (email, role, source, answers, referral_code)
         VALUES ($1, $2, $3, $4::jsonb, $5) ON CONFLICT (email) DO NOTHING RETURNING id`,
        [signup.email, signup.role ?? null, signup.source, JSON.stringify(signup.answers ?? {}), code],
      );
      const duplicate = !inserted.rowCount;
      let referralCode: string = code;
      if (duplicate) {
        const existing = await client.query(
          "UPDATE tubelight_waitlist SET referral_code = COALESCE(referral_code, $2) WHERE email = $1 RETURNING referral_code",
          [signup.email, code],
        );
        referralCode = existing.rows[0].referral_code;
      } else if (ref) {
        await client.query(
          "UPDATE tubelight_waitlist SET referrals = referrals + 1, boost = boost + $1 WHERE referral_code = $2 AND email <> $3",
          [PRIORITY_POINTS, ref, signup.email],
        );
      }
      const count = await client.query("SELECT COUNT(*)::int AS total FROM tubelight_waitlist");
      await client.query("COMMIT");
      statsCache = null;
      return { duplicate, total: Number(count.rows[0].total), referralCode };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
  return fileMutation(async () => {
    const all = await readAll();
    const existing = all.find((s) => s.email === signup.email);
    const member = existing ?? signup;
    member.referralCode ??= code;
    if (!existing) {
      const inviter = ref && all.find((s) => s.referralCode === ref);
      if (inviter) {
        inviter.referrals = (inviter.referrals ?? 0) + 1;
        inviter.boost = (inviter.boost ?? 0) + PRIORITY_POINTS;
      }
      all.push(member);
    }
    await writeAll(all);
    statsCache = null;
    return { duplicate: !!existing, total: all.length, referralCode: member.referralCode };
  });
}

/* ---------- ranking: boost DESC, created_at ASC, id ASC ---------- */

type Queryable = Pick<Pool, "query">;

async function pgStatus(q: Queryable, email: string): Promise<{ position: number; boost: number } | null> {
  const result = await q.query<{ position: number; boost: number }>(
    `SELECT 1 + (SELECT COUNT(*)::int FROM tubelight_waitlist other
       WHERE (-other.boost, other.created_at, other.id) < (-me.boost, me.created_at, me.id)) AS position, me.boost
     FROM tubelight_waitlist me WHERE me.email = $1`, [email]);
  return result.rows[0] ?? null;
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
export async function getWaitlistStatus(email: string) {
  const db = getPool();
  if (db) {
    await ensureTable(db);
    return pgStatus(db, email);
  }
  const all = await readAll();
  const member = all.find((s) => s.email === email);
  return member ? { position: filePosition(all, email), boost: member.boost ?? 0 } : null;
}

export async function getTotal(): Promise<number> {
  const db = getPool();
  if (db) {
    await ensureTable(db);
    const r = await db.query<{ n: number }>(`SELECT COUNT(*)::int AS n FROM tubelight_waitlist`);
    return r.rows[0]?.n ?? 0;
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
  return PRIORITY_POINTS * countAnswered(answers);
}

function roleFrom(answers: Answers): string | null {
  const a = answers["0"];
  const role = Array.isArray(a) ? a[0] : a;
  return role?.trim().slice(0, 60) || null;
}

export type AnswerResult = { position: number; previousPosition: number; boost: number };

/** answer === null means "skipped": nothing is stored. Returns null if the email isn't on the list. */
export async function saveAnswer(email: string, question: number, answer: AnswerValue | null): Promise<AnswerResult | null> {
  const key = String(question);
  const db = getPool();
  if (db) {
    await ensureTable(db);
    const client = await db.connect();
    try {
      await client.query("BEGIN");
      const cur = await client.query<{ answers: Answers; boost: number; referrals: number }>(
        `SELECT answers, boost, referrals FROM tubelight_waitlist WHERE email = $1 FOR UPDATE`,
        [email],
      );
      if (!cur.rows[0]) {
        await client.query("ROLLBACK");
        return null;
      }
      const previousPosition = (await pgStatus(client, email))?.position ?? 1;
      if (answer === null) {
        await client.query("COMMIT");
        return { position: previousPosition, previousPosition, boost: cur.rows[0].boost };
      }
      const answers: Answers = { ...(cur.rows[0].answers ?? {}), [key]: answer };
      const boost = boostFor(answers) + cur.rows[0].referrals * PRIORITY_POINTS;
      await client.query(
        `UPDATE tubelight_waitlist
            SET answers = $2::jsonb, boost = $3, role = COALESCE($4, role)
          WHERE email = $1`,
        [email, JSON.stringify(answers), boost, question === 0 ? roleFrom(answers) : null],
      );
      const position = (await pgStatus(client, email))?.position ?? previousPosition;
      await client.query("COMMIT");
      return { position, previousPosition, boost };
    } catch (err) {
      await client.query("ROLLBACK").catch(() => undefined);
      throw err;
    } finally {
      client.release();
    }
  }

  return fileMutation(async () => {
    const all = await readAll();
    const me = all.find((s) => s.email === email);
    if (!me) return null;
    const previousPosition = filePosition(all, email) ?? 1;
    if (answer === null) return { position: previousPosition, previousPosition, boost: me.boost ?? 0 };
    me.answers = { ...(me.answers ?? {}), [key]: answer };
    me.boost = boostFor(me.answers) + (me.referrals ?? 0) * PRIORITY_POINTS;
    if (question === 0) me.role = roleFrom(me.answers) ?? me.role;
    await writeAll(all);
    return { position: filePosition(all, email) ?? previousPosition, previousPosition, boost: me.boost };
  });
}

/* ---------- public stats (cached 60 s) ---------- */

export type WaitlistStats = { total: number; thisWeek: number };
let statsCache: { at: number; value: WaitlistStats } | null = null;

export async function getStats(): Promise<WaitlistStats> {
  if (statsCache && Date.now() - statsCache.at < 60_000) return statsCache.value;
  let value: WaitlistStats | null = null;
  const db = getPool();
  if (db) {
    await ensureTable(db);
    const r = await db.query<{ total: number; week: number }>(
      `SELECT COUNT(*)::int AS total,
              COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days')::int AS week
         FROM tubelight_waitlist`,
    );
    value = { total: r.rows[0]?.total ?? 0, thisWeek: r.rows[0]?.week ?? 0 };
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

