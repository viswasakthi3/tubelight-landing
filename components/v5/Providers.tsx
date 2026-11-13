"use client";

import dynamic from "next/dynamic";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { VideoMap } from "@/lib/video-paths";
import { track } from "@/lib/track";
import { pauseOthers } from "./media";
import type { PlayerSource } from "./Player";
import { WaitlistProvider } from "./WaitlistContext";
import { WaitlistDialog } from "./WaitlistDialog";

// The player is only needed once someone presses play, so it stays out of the first load.
const loadPlayer = () => import("./Player");
const Player = dynamic(loadPlayer, { ssr: false });

const VideosCtx = createContext<VideoMap>({});
export const useVideos = () => useContext(VideosCtx);

type PlayerApi = {
  /** Play a ready-made video from `t` seconds. `returnTo` gets the focus back when the player closes. */
  open: (slug: string, t?: number, returnTo?: HTMLElement | null) => void;
  /** Make a free preview for the topic and show it in the player. */
  live: (topic: string, returnTo?: HTMLElement | null) => void;
  close: () => void;
};
const PlayerCtx = createContext<PlayerApi>({ open: () => {}, live: () => {}, close: () => {} });
export const usePlayer = () => useContext(PlayerCtx);

export function V5Providers({ videos, children }: { videos: VideoMap; children: React.ReactNode }) {
  const [source, setSource] = useState<(PlayerSource & { n: number }) | null>(null);
  const opener = useRef<HTMLElement | null>(null);
  const count = useRef(0);

  // Warm the player's code once the page is idle, so the first press of play is instant.
  useEffect(() => {
    const id = setTimeout(() => void loadPlayer(), 2500);
    return () => clearTimeout(id);
  }, []);

  const show = useCallback((s: PlayerSource, returnTo?: HTMLElement | null) => {
    opener.current = returnTo ?? (document.activeElement instanceof HTMLElement ? document.activeElement : null);
    pauseOthers("player");
    count.current += 1;
    setSource({ ...s, n: count.current });
  }, []);

  const open = useCallback(
    (slug: string, t = 0, returnTo?: HTMLElement | null) => {
      track("player_open", { slug });
      show({ kind: "video", slug, t }, returnTo);
    },
    [show],
  );
  const live = useCallback(
    (topic: string, returnTo?: HTMLElement | null) => {
      track("player_open", { live: true });
      show({ kind: "live", topic }, returnTo);
    },
    [show],
  );
  const close = useCallback(() => {
    setSource(null);
    const el = opener.current;
    opener.current = null;
    if (el) setTimeout(() => el.focus({ preventScroll: true }), 0);
  }, []);

  const api = useMemo<PlayerApi>(() => ({ open, live, close }), [open, live, close]);

  return (
    <VideosCtx.Provider value={videos}>
      <WaitlistProvider>
        <PlayerCtx.Provider value={api}>
          {children}
          {source ? <Player key={source.n} source={source} videos={videos} onClose={close} /> : null}
          <WaitlistDialog />
        </PlayerCtx.Provider>
      </WaitlistProvider>
    </VideosCtx.Provider>
  );
}
