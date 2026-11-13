/**
 * A stand-in for the Tubelight backend's POST /api/web/explain, so the landing page's live preview
 * (the player's "Making your video…" flow) can be tried locally at no cost and with no database.
 *
 *   node scripts/mock-web-explain.mjs
 *   T2U_API_URL=http://localhost:8799 WEB_EXPLAIN_SECRET=dev-secret npm run dev      (in another terminal)
 *
 * It speaks the same contract as t2u_backend/webExplain.js:
 *   - header  x-web-explain-secret  must equal MOCK_SECRET (default "dev-secret"), else 401
 *   - body    { topic }             2 to 200 characters, one line, no links, else 400 { error: "bad_topic" }
 *   - then it streams NDJSON: a "plan" frame (title, beats with say + sheet, sheets) after about 2 s, one
 *     "image" frame per picture about every 1.5 s (data:image/png), one "voice" frame per beat
 *     (data:audio/mpeg), and a final "done".
 * The video is a real saved explanation from the Tubelight library, so it looks and sounds right.
 *
 * Magic topics, to see the player's error states:
 *   bad    -> 400 bad_topic           limit -> 429 { scope: "ip" }
 *   busy   -> 429 { scope: "busy" }   day   -> 429 { scope: "day" }
 *   drop   -> the stream is cut after the plan (the "connection dropped" state)
 *
 * Environment:
 *   MOCK_PORT    port to listen on (default 8799)
 *   MOCK_SECRET  the shared secret (default "dev-secret")
 *   MOCK_ITEM    folder of a saved library item (default the kidneys explanation below); its title
 *                comes from ../index.json next to the items folder, falling back to "Mock preview"
 */
import { createServer } from "node:http";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const PORT = Number(process.env.MOCK_PORT) || 8799;
const SECRET = process.env.MOCK_SECRET || "dev-secret";
const ITEM =
  process.env.MOCK_ITEM || "C:\\Users\\viswa\\AppData\\Roaming\\Tubelight Library\\items\\instant_1788991015305_8ccuf";

const PLAN_MS = 2000;
const IMAGE_EVERY_MS = 1500;
const VOICE_EVERY_MS = 250;

function loadItem(dir) {
  const meta = JSON.parse(readFileSync(path.join(dir, "meta.json"), "utf8"));
  let title = "Mock preview";
  try {
    const index = JSON.parse(readFileSync(path.join(path.dirname(path.dirname(dir)), "index.json"), "utf8"));
    title = index.entries?.[path.basename(dir)]?.title || title;
  } catch {
    /* no index: keep the fallback */
  }
  const file = (name, mime) => {
    const p = path.join(dir, name);
    if (!existsSync(p)) return null;
    const bytes = readFileSync(p);
    const type = bytes[0] === 0xff && bytes[1] === 0xd8 ? "image/jpeg" : mime; // the library names JPEGs image-N.png
    return `data:${type};base64,${bytes.toString("base64")}`;
  };
  const beats = meta.beats.map((b) => ({ say: String(b.say ?? ""), sheet: Number.isInteger(b.sheet) ? b.sheet : 0 }));
  const sheets = meta.sheets.map((s, i) => ({ index: s.index ?? i, title: s.title ?? `Picture ${i + 1}` }));
  return {
    title,
    beats,
    sheets,
    images: sheets.map((_, i) => file(`image-${i}.png`, "image/png")),
    voices: beats.map((_, i) => file(`voice-${i}.mp3`, "audio/mpeg")),
  };
}

function validateTopic(raw) {
  if (typeof raw !== "string") return null;
  const topic = raw.trim();
  if (topic.length < 2 || topic.length > 200) return null;
  if (/[\r\n]/.test(topic)) return null;
  if (/https?:\/\/|www\./i.test(topic)) return null;
  if (/^\S+\.[a-z]{2,}(\/\S*)?$/i.test(topic)) return null;
  return topic;
}

function readBody(req) {
  return new Promise((resolve) => {
    let raw = "";
    req.on("data", (c) => {
      raw += c;
      if (raw.length > 20_000) req.destroy();
    });
    req.on("end", () => {
      try {
        resolve(JSON.parse(raw));
      } catch {
        resolve(null);
      }
    });
    req.on("error", () => resolve(null));
  });
}

const json = (res, status, body) => {
  res.writeHead(status, { "Content-Type": "application/json", "Cache-Control": "no-store" });
  res.end(JSON.stringify(body));
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const item = loadItem(ITEM);

const server = createServer(async (req, res) => {
  if (req.method !== "POST" || req.url?.split("?")[0] !== "/api/web/explain") return json(res, 404, { error: "not_found" });
  if (req.headers["x-web-explain-secret"] !== SECRET) return json(res, 401, { error: "unauthorized" });

  const body = await readBody(req);
  const topic = validateTopic(body?.topic);
  if (!topic) return json(res, 400, { error: "bad_topic" });

  const magic = topic.toLowerCase();
  if (magic === "bad") return json(res, 400, { error: "bad_topic" });
  if (magic === "limit") return json(res, 429, { error: "limit", scope: "ip" });
  if (magic === "busy") return json(res, 429, { error: "limit", scope: "busy" });
  if (magic === "day") return json(res, 429, { error: "limit", scope: "day" });

  res.writeHead(200, {
    "Content-Type": "application/x-ndjson; charset=utf-8",
    "Cache-Control": "no-store, no-transform",
    "X-Accel-Buffering": "no",
  });
  let open = true;
  res.on("close", () => {
    open = false;
  });
  const send = (frame) => {
    if (open) res.write(`${JSON.stringify(frame)}\n`);
  };

  const started = Date.now();
  await sleep(PLAN_MS);
  if (!open) return;
  send({ type: "plan", data: { id: `mock_${started}`, title: item.title, beats: item.beats, sheets: item.sheets } });

  if (magic === "drop") {
    await sleep(800);
    res.destroy();
    return;
  }

  const total = item.sheets.length;
  const images = (async () => {
    for (let i = 0; i < total && open; i++) {
      await sleep(IMAGE_EVERY_MS);
      if (item.images[i]) send({ type: "image", data: { index: i, total, imageUrl: item.images[i], model: "mock" } });
      else send({ type: "image", index: i, total, error: `Picture ${i + 1} of ${total} could not be drawn.` });
    }
  })();
  const voices = (async () => {
    for (let i = 0; i < item.beats.length && open; i++) {
      await sleep(VOICE_EVERY_MS);
      if (item.voices[i]) send({ type: "voice", data: { index: i, total: item.beats.length, text: item.beats[i].say, audio: item.voices[i] } });
    }
  })();
  await Promise.all([images, voices]);
  send({ type: "done", ms: Date.now() - started, images: total, sheets: total });
  if (open) res.end();
});

server.listen(PORT, () => {
  console.log(`[mock-web-explain] listening on http://localhost:${PORT}  (secret "${SECRET === "dev-secret" ? "dev-secret" : "set via MOCK_SECRET"}")`);
  console.log(`[mock-web-explain] serving "${item.title}": ${item.sheets.length} pictures, ${item.beats.length} beats`);
});
