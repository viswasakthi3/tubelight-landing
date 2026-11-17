/** Browser side of the free preview: reads /api/preview's NDJSON stream into typed events. */

export type PreviewBeat = { say: string; sheet: number };
export type PreviewSheet = { index: number; title: string };
export type PreviewErrorCode =
  | "limit_identity"
  | "limit_ip"
  | "limit_day"
  | "busy"
  | "disabled"
  | "bad_topic"
  | "bad_email"
  | "preview_unavailable"
  | "network";

export type PreviewEvent =
  | { type: "plan"; title: string; beats: PreviewBeat[]; sheets: PreviewSheet[] }
  | { type: "image"; index: number; src: string }
  | { type: "image_error"; index: number }
  | { type: "voice"; index: number; src: string }
  | { type: "voice_error"; index: number }
  | { type: "done" }
  | { type: "error"; code: PreviewErrorCode };

export type PreviewStatus = "starting" | "planning" | "drawing" | "voicing" | "saving" | "ready" | "error";

export type PreviewState = {
  status: PreviewStatus;
  title: string;
  beats: PreviewBeat[];
  sheets: PreviewSheet[];
  images: (string | null)[];
  /** Pictures the backend gave up on (the player shows an info state for them). */
  imageFailed: boolean[];
  voices: (string | null)[];
  /** Pictures settled, drawn or failed. */
  imagesReady: number;
  /** Voice lines settled, spoken or failed. */
  voicesReady: number;
  error?: PreviewErrorCode;
};

export const initialPreviewState: PreviewState = {
  status: "starting",
  title: "",
  beats: [],
  sheets: [],
  images: [],
  imageFailed: [],
  voices: [],
  imagesReady: 0,
  voicesReady: 0,
};

function settle(list: (string | null)[], index: number, value: string): (string | null)[] | null {
  if (index < 0 || index >= list.length) return null;
  const next = list.slice();
  next[index] = value;
  return next;
}

function progress(s: PreviewState): PreviewState {
  if (s.status === "ready" || s.status === "error" || s.sheets.length === 0) return s;
  if (s.imagesReady < s.sheets.length) return { ...s, status: "drawing" };
  if (s.voicesReady < s.beats.length) return { ...s, status: "voicing" };
  return { ...s, status: "saving" };
}

export function reducePreview(state: PreviewState, event: PreviewEvent): PreviewState {
  switch (event.type) {
    case "plan":
      return progress({
        ...state,
        status: "drawing",
        title: event.title,
        beats: event.beats,
        sheets: event.sheets,
        images: event.sheets.map(() => null),
        imageFailed: event.sheets.map(() => false),
        voices: event.beats.map(() => null),
        imagesReady: 0,
        voicesReady: 0,
      });
    case "image": {
      const images = settle(state.images, event.index, event.src);
      if (!images) return state;
      // A redrawn picture replaces the first without counting twice.
      const fresh = state.images[event.index] === null;
      const imageFailed = state.imageFailed.slice();
      imageFailed[event.index] = false;
      return progress({ ...state, images, imageFailed, imagesReady: state.imagesReady + (fresh ? 1 : 0) });
    }
    case "image_error": {
      if (event.index < 0 || event.index >= state.images.length) return state;
      const imageFailed = state.imageFailed.slice();
      imageFailed[event.index] = true;
      return progress({ ...state, imageFailed, imagesReady: Math.min(state.sheets.length, state.imagesReady + 1) });
    }
    case "voice": {
      const voices = settle(state.voices, event.index, event.src);
      if (!voices) return state;
      const fresh = state.voices[event.index] === null;
      return progress({ ...state, voices, voicesReady: state.voicesReady + (fresh ? 1 : 0) });
    }
    case "voice_error":
      // The backend reports a failed voice without an index: the whole voice is gone.
      if (event.index < 0 || event.index >= state.voices.length) {
        return progress({ ...state, voicesReady: state.beats.length });
      }
      return progress({ ...state, voicesReady: Math.min(state.beats.length, state.voicesReady + 1) });
    case "done":
      return state.status === "error" ? state : { ...state, status: "ready" };
    case "error":
      return { ...state, status: "error", error: event.code };
  }
}

export function previewStageText(state: PreviewState): string {
  switch (state.status) {
    case "starting":
    case "planning":
    case "error":
      return "Writing the story…";
    case "drawing": {
      const total = Math.max(state.sheets.length, 1);
      return `Drawing picture ${Math.min(state.imagesReady + 1, total)} of ${total}…`;
    }
    case "voicing":
      return "Recording the voice…";
    case "ready":
      return "Ready";
    case "saving":
      return "Saving your video…";
  }
}

const HTTP_CODES: Record<number, PreviewErrorCode> = {
  503: "preview_unavailable",
  409: "preview_unavailable",
  400: "bad_topic",
  403: "preview_unavailable",
};

async function codeFromResponse(res: Response): Promise<PreviewErrorCode> {
  if (res.status === 429) {
    const body = (await res.json().catch(() => null)) as { scope?: string } | null;
    if (body?.scope === "identity") return "limit_identity";
    if (body?.scope === "ip") return "limit_ip";
    if (body?.scope === "day") return "limit_day";
    if (body?.scope === "busy") return "busy";
    return "limit_identity";
  }
  if (res.status === 409 || res.status === 503) {
    return "preview_unavailable";
  }
  if (res.status === 400) {
    const body = (await res.json().catch(() => null)) as { error?: string } | null;
    if (body?.error === "bad_email") return "bad_email";
    return "bad_topic";
  }
  return HTTP_CODES[res.status] ?? "network";
}

function toEvent(frame: Record<string, unknown>): PreviewEvent | null {
  const data = (frame.data ?? {}) as Record<string, unknown>;
  const idx = (v: unknown) => (typeof v === "number" ? v : -1);
  switch (frame.type) {
    case "plan": {
      const beats = (Array.isArray(data.beats) ? data.beats : []).map((b) => {
        const beat = b as Record<string, unknown>;
        return { say: String(beat.say ?? ""), sheet: idx(beat.sheet) };
      });
      const sheets = (Array.isArray(data.sheets) ? data.sheets : []).map((s, i) => {
        const sheet = s as Record<string, unknown>;
        return { index: typeof sheet.index === "number" ? sheet.index : i, title: String(sheet.title ?? "") };
      });
      return { type: "plan", title: String(data.title ?? ""), beats, sheets };
    }
    case "image":
      if (frame.error) return { type: "image_error", index: idx(frame.index) };
      return typeof data.imageUrl === "string" ? { type: "image", index: idx(data.index), src: data.imageUrl } : null;
    case "voice":
      if (frame.error) return { type: "voice_error", index: idx(frame.index ?? data.index) };
      return typeof data.audio === "string" ? { type: "voice", index: idx(data.index), src: data.audio } : null;
    case "done":
      return { type: "done" };
    case "error":
      return { type: "error", code: frame.code === "preview_unavailable" ? "preview_unavailable" : "network" };
    default:
      return null; // notice, quota, focus and anything new
  }
}

/** POST the topic and email, and emit events until the stream ends. Never throws; failures arrive as an "error" event. */
export async function startPreview(
  topic: string,
  email: string,
  onEvent: (event: PreviewEvent) => void,
  signal?: AbortSignal,
): Promise<void> {
  let res: Response;
  try {
    const bootstrap = await fetch("/api/preview", { method: "GET", cache: "no-store", signal });
    if (!bootstrap.ok) {
      if (!signal?.aborted) onEvent({ type: "error", code: await codeFromResponse(bootstrap) });
      return;
    }
    res = await fetch("/api/preview", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ topic, email }),
      signal,
    });
  } catch {
    if (!signal?.aborted) onEvent({ type: "error", code: "network" });
    return;
  }
  if (!res.ok || !res.body) {
    onEvent({ type: "error", code: await codeFromResponse(res) });
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let finished = false;
  const handle = (line: string) => {
    if (!line.trim()) return;
    try {
      const event = toEvent(JSON.parse(line));
      if (!event) return;
      if (event.type === "done" || event.type === "error") finished = true;
      onEvent(event);
    } catch {
      /* a torn or non-JSON line is skipped */
    }
  };

  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      let nl: number;
      while ((nl = buffer.indexOf("\n")) >= 0) {
        handle(buffer.slice(0, nl));
        buffer = buffer.slice(nl + 1);
      }
    }
    buffer += decoder.decode();
    handle(buffer);
  } catch {
    if (!signal?.aborted && !finished) onEvent({ type: "error", code: "network" });
    return;
  }
  // The stream closed without "done" or "error": the connection dropped mid-run.
  if (!finished && !signal?.aborted) onEvent({ type: "error", code: "network" });
}
