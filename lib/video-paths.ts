/** Client-safe video types and constants (no fs). */
export type Cue = { start: number; end: number; text: string };

/** One picture of a video: the full image, a small thumbnail, and when it is on screen. */
export type Sheet = { index: number; title: string; src: string; thumb: string; start: number; end: number };

export type VideoInfo = {
  slug: string;
  title: string;
  duration: number;
  cues: Cue[];
  src: string;
  sheets: Sheet[];
  poster: string;
  thumb: string;
};

export type VideoMap = Record<string, VideoInfo>;

export const DEMO = {
  src: "/videos/tubelight-demo.mp4",
  poster: "/videos/tubelight-demo-poster.jpg",
};
