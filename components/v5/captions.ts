/** Two caption lines, like the app (about 40–46 characters each). */
export function wrap2(text: string): string[] {
  const w = String(text || "").trim().split(/\s+/);
  if (!w[0]) return [];
  const max = Math.max(40, Math.ceil(text.length / 2) + 4);
  const lines = [""];
  w.forEach((x) => {
    const l = lines[lines.length - 1];
    if (l && (l + " " + x).length > max && lines.length < 2) lines.push(x);
    else lines[lines.length - 1] = l ? l + " " + x : x;
  });
  return lines;
}

const CHUNK_MAX = 86; // two lines of about 43 characters

/** A sentence longer than two lines, cut into even pieces at word breaks. */
function balance(text: string): string[] {
  const k = Math.ceil(text.length / CHUNK_MAX);
  if (k <= 1) return [text];
  const target = text.length / k;
  const out: string[] = [];
  let cur = "";
  for (const word of text.split(" ")) {
    cur = cur ? cur + " " + word : word;
    if (cur.length >= target && out.length < k - 1) {
      out.push(cur);
      cur = "";
    }
  }
  if (cur) out.push(cur);
  return out;
}

/** A spoken line split into pieces that each fit two caption lines, one sentence at a time where it can. */
export function chunkSay(say: string): string[] {
  const text = String(say || "").trim().replace(/\s+/g, " ");
  if (!text) return [];
  const sentences = (text.match(/[^.!?]+(?:[.!?]+["”’)]*)?/g) ?? [text]).map((x) => x.trim()).filter(Boolean);
  const out: string[] = [];
  for (const piece of sentences.flatMap(balance)) {
    const last = out[out.length - 1];
    if (last && (last + " " + piece).length <= CHUNK_MAX) out[out.length - 1] = last + " " + piece;
    else out.push(piece);
  }
  return out;
}

/** The piece to show when `frac` (0 to 1) of the clip has played, in proportion to each piece's length. */
export function chunkAt(chunks: string[], frac: number): string {
  if (!chunks.length) return "";
  const total = chunks.reduce((n, c) => n + c.length, 0);
  const at = Math.min(0.9999, Math.max(0, frac)) * total;
  let acc = 0;
  for (const c of chunks) {
    acc += c.length;
    if (at < acc) return c;
  }
  return chunks[chunks.length - 1];
}

/** How long a line stays up when its voice clip is missing: about 2.6 words a second, at least 3.5 s. */
export function estimateSeconds(say: string): number {
  const n = String(say || "").trim().split(/\s+/).filter(Boolean).length;
  return Math.max(3.5, n / 2.6);
}
