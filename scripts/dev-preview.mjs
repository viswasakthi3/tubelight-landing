// Run the real Tubelight preview handler locally alongside the landing dev server.
import nextEnv from "@next/env";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import path from "node:path";
import { readFileSync } from "node:fs";
import { parseEnv } from "node:util";

nextEnv.loadEnvConfig(process.cwd(), true);
const url = new URL(process.env.T2U_API_URL || "http://localhost:8799");
if (!["127.0.0.1", "localhost"].includes(url.hostname) || !process.env.WEB_EXPLAIN_SECRET) {
  throw new Error("Set a local T2U_API_URL and WEB_EXPLAIN_SECRET in .env.local.");
}
const backend = path.resolve(process.env.T2U_BACKEND_DIR || "../time2understand/t2u_backend");
const localSecret = process.env.WEB_EXPLAIN_SECRET;
process.chdir(backend);
Object.assign(process.env, parseEnv(readFileSync(".env", "utf8")), { WEB_EXPLAIN_SECRET: localSecret });
const require = createRequire(path.join(backend, "package.json"));
const express = require("express");
const { handleWebExplain } = await import(pathToFileURL(path.join(backend, "webExplain.js")).href);
const app = express();
app.use(express.json());
app.post("/api/web/explain", handleWebExplain);
app.listen(Number(url.port || 80), "127.0.0.1", () => console.log("Local preview ready at", url.origin));
