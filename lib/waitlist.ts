import { promises as fs } from "node:fs";
import path from "node:path";

export type Signup = {
  email: string;
  source: string;
  role?: string;
  createdAt: string;
};

const FILE = path.join(process.cwd(), "data", "waitlist.json");

/**
 * Local JSON storage. Fine for a beta list on a single box; on a read-only
 * host (Vercel, Netlify) writes fail silently and WAITLIST_WEBHOOK_URL /
 * Resend become the system of record instead.
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
