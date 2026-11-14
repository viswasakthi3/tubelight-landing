// Local dev server with the database disabled, so the waitlist
// uses the local JSON fallback (data/waitlist.json) and never touches the real DB.
// Next binds IPv6 only on this machine: open http://localhost:3005, not 127.0.0.1.
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
const cwd = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const env = { ...process.env, DATABASE_URL: "", PORT: "3005" };
const next = spawn(process.execPath, [path.join(cwd, "node_modules/next/dist/bin/next"), "dev", "-p", "3005"], { cwd, env, stdio: "inherit" });
next.on("exit", (code) => process.exit(code ?? 0));
