import { readFileSync } from "node:fs";
import path from "node:path";

import type { Beat, Sheet, VideoInfo, VideoMap } from "./video-paths";

export type { Beat, Cue, Sheet, VideoInfo, VideoMap } from "./video-paths";
export { DEMO } from "./video-paths";

export const VIDEO_SLUGS = [
  "rocket", "headaches", "dna", "ocean", "tv", "polar-bear", "insurance",
  "kidneys", "zombie-cells", "neurons", "appendix", "black-holes", "dark-matter",
] as const;

const DIR = path.join(process.cwd(), "public", "videos");

function readSheets(slug: string, raw: unknown): Sheet[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((s, i) => {
    const sheet = (s ?? {}) as Partial<Sheet>;
    const index = typeof sheet.index === "number" ? sheet.index : i;
    return {
      index,
      title: String(sheet.title ?? ""),
      src: sheet.src ?? `/videos/${slug}/p${index}.webp`,
      thumb: sheet.thumb ?? `/videos/${slug}/p${index}-s.webp`,
      start: Number(sheet.start) || 0,
      end: Number(sheet.end) || 0,
      walk: sheet.walk === true,
      pw: typeof sheet.pw === "number" && sheet.pw > 0 ? sheet.pw : 1,
    };
  });
}

function readBeats(raw: unknown): Beat[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((b) => {
    const beat = (b ?? {}) as { start?: unknown; end?: unknown; sheet?: unknown; ptr?: { x?: unknown; y?: unknown } | null };
    const x = Number(beat.ptr?.x);
    const y = Number(beat.ptr?.y);
    return {
      start: Number(beat.start) || 0,
      end: Number(beat.end) || 0,
      sheet: Number(beat.sheet) || 0,
      ptr: beat.ptr && Number.isFinite(x) && Number.isFinite(y) ? { x, y } : null,
    };
  });
}

/** Reads public/videos/<slug>.json on the server and builds the data map the landing page needs. */
export function getVideos(): VideoMap {
  const out: VideoMap = {};
  for (const slug of VIDEO_SLUGS) {
    try {
      const j = JSON.parse(readFileSync(path.join(DIR, `${slug}.json`), "utf8")) as Partial<VideoInfo>;
      out[slug] = {
        slug,
        title: j.title ?? slug,
        duration: j.duration ?? 0,
        cues: j.cues ?? [],
        src: `/videos/${slug}.mp4`,
        sheets: readSheets(slug, j.sheets),
        beats: readBeats(j.beats),
        poster: `/videos/${slug}-poster.jpg`,
        thumb: `/videos/${slug}-thumb.webp`,
      };
    } catch (err) {
      console.error(`[videos] could not read ${slug}.json`, err);
    }
  }
  return out;
}
