"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";
import type { VideoMap } from "@/lib/video-paths";
import { track } from "@/lib/track";
import { pauseOthers } from "./media";
import { VideoLightbox } from "./VideoLightbox";
import { WaitlistProvider } from "./WaitlistContext";
import { WaitlistDialog } from "./WaitlistDialog";

const VideosCtx = createContext<VideoMap>({});
export const useVideos = () => useContext(VideosCtx);

type LbCtx = { slug: string | null; open: (slug: string) => void; close: () => void };
const LightboxCtx = createContext<LbCtx>({ slug: null, open: () => {}, close: () => {} });
export const useLightbox = () => useContext(LightboxCtx);

export function V5Providers({ videos, children }: { videos: VideoMap; children: React.ReactNode }) {
  const [slug, setSlug] = useState<string | null>(null);
  const opener = useRef<HTMLElement | null>(null);

  const open = useCallback((s: string) => {
    opener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    pauseOthers("lightbox");
    track("gallery_video_play", { slug: s });
    setSlug(s);
  }, []);
  const close = useCallback(() => {
    setSlug(null);
    const el = opener.current;
    opener.current = null;
    if (el) setTimeout(() => el.focus({ preventScroll: true }), 0);
  }, []);

  return (
    <VideosCtx.Provider value={videos}>
      <WaitlistProvider>
        <LightboxCtx.Provider value={{ slug, open, close }}>
          {children}
          {slug && videos[slug] ? <VideoLightbox video={videos[slug]} onClose={close} /> : null}
          <WaitlistDialog />
        </LightboxCtx.Provider>
      </WaitlistProvider>
    </VideosCtx.Provider>
  );
}
