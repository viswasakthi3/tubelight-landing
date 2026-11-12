/** Client-safe video types and constants (no fs). */
export type Cue = { start: number; end: number; text: string };

export type VideoInfo = {
  slug: string;
  title: string;
  duration: number;
  cues: Cue[];
  src: string;
  shortSrc?: string;
  shortDuration?: number;
  shortCues?: Cue[];
  poster: string;
  thumb: string;
};

export type VideoMap = Record<string, VideoInfo>;

export const DEMO = {
  src: "/videos/tubelight-demo.mp4",
  poster: "/videos/tubelight-demo-poster.jpg",
};

