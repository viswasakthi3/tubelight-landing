import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import type { VideoInfo, VideoMap } from "./video-paths";

export type { Cue, VideoInfo, VideoMap } from "./video-paths";
export { DEMO } from "./video-paths";

export const VIDEO_SLUGS = ["rocket", "headaches", "dna", "ocean", "tv", "polar-bear", "insurance"] as const;

const DIR = path.join(process.cwd(), "public", "videos");

/** Reads public/videos/<slug>.json on the server and builds the data map the landing page needs. */
export function getVideos(): VideoMap {
  const out: VideoMap = {};
  for (const slug of VIDEO_SLUGS) {
    try {
      const j = JSON.parse(readFileSync(path.join(DIR, `${slug}.json`), "utf8")) as Partial<VideoInfo>;
      const hasShort = existsSync(path.join(DIR, `${slug}-short.mp4`));
      out[slug] = {
        slug,
        title: j.title ?? slug,
        duration: j.duration ?? 0,
        cues: j.cues ?? [],
        src: `/videos/${slug}.mp4`,
        shortSrc: hasShort ? `/videos/${slug}-short.mp4` : undefined,
        shortDuration: hasShort ? j.shortDuration : undefined,
        shortCues: hasShort ? j.shortCues : undefined,
        poster: `/videos/${slug}-poster.jpg`,
        thumb: `/videos/${slug}-thumb.webp`,
      };
    } catch (err) {
      console.error(`[videos] could not read ${slug}.json`, err);
    }
  }
  return out;
}
