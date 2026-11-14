/** Client-safe video types and constants (no fs). */
export type Cue = { start: number; end: number; text: string };

/** One picture of a video: the full image, a small thumbnail, and when it is on screen. */
export type Sheet = { index: number; title: string; src: string; thumb: string; start: number; end: number;
  /** the pointer may glide across this picture (it has two or more different places) */
  walk?: boolean;
  /** width of the picture as a fraction of the video frame (sizes the pointer) */
  pw?: number;
};

/** One narrated beat: which picture is up, and where the app's pointer rests (fractions of the 1280x720 frame, or null). */
export type Beat = { start: number; end: number; sheet: number; ptr: { x: number; y: number } | null };

export type VideoInfo = {
  slug: string;
  title: string;
  duration: number;
  cues: Cue[];
  src: string;
  sheets: Sheet[];
  beats: Beat[];
  poster: string;
  thumb: string;
};

export type VideoMap = Record<string, VideoInfo>;

export const DEMO = {
  src: "/videos/tubelight-demo.mp4",
  poster: "/videos/tubelight-demo-poster.jpg",
};
