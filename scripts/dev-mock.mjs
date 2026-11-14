// Local dev server for testing the live preview at no cost:
// disabled DB (JSON waitlist fallback) + /api/preview pointed at scripts/mock-web-explain.mjs.
// Mock topics "limit", "busy", "bad", "day", "drop" trigger the error states.
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
const cwd = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const mock = spawn(process.execPath, ["scripts/mock-web-explain.mjs"], { cwd, env: { ...process.env, MOCK_SECRET: "dev-secret" }, stdio: "inherit" });
const env = { ...process.env, DATABASE_URL: "", PORT: "3005", T2U_API_URL: "http://localhost:8799", WEB_EXPLAIN_SECRET: "dev-secret" };
const next = spawn(process.execPath, [path.join(cwd, "node_modules/next/dist/bin/next"), "dev", "-p", "3005"], { cwd, env, stdio: "inherit" });
const stop = () => { try { mock.kill(); } catch {} try { next.kill(); } catch {} };
next.on("exit", (code) => { stop(); process.exit(code ?? 0); });
process.on("SIGTERM", stop); process.on("SIGINT", stop);
