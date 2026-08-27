"use client";

import { useEffect, useState, type RefObject } from "react";

/**
 * Deliberately not IntersectionObserver and deliberately not rAF-driven.
 * Inside an iframe the observer's implicit root is the top-level viewport, and
 * rAF is throttled for offscreen frames — either one can leave a reveal stuck
 * at opacity 0 and blank the page. A throttled rect check behaves identically
 * everywhere, and reading a handful of rects every 100ms costs nothing.
 */
export function useInViewport<T extends HTMLElement>(
  ref: RefObject<T | null>,
  { once = false, offset = 48 }: { once?: boolean; offset?: number } = {},
): boolean {
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let lastRun = 0;
    let trailing = 0;
    let stopped = false;

    const check = () => {
      lastRun = Date.now();
      const rect = el.getBoundingClientRect();
      const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
      const visible = rect.top < viewportHeight - offset && rect.bottom > offset;

      setInView((previous) => (previous === visible ? previous : visible));
      if (visible && once) teardown();
    };

    const onScroll = () => {
      if (stopped) return;
      const since = Date.now() - lastRun;
      if (since >= 100) {
        check();
        return;
      }
      // Trailing edge: the scroll that ends mid-throttle must still be seen.
      if (!trailing) {
        trailing = window.setTimeout(() => {
          trailing = 0;
          if (!stopped) check();
        }, 100 - since);
      }
    };

    function teardown() {
      stopped = true;
      if (trailing) window.clearTimeout(trailing);
      trailing = 0;
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    }

    check();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return teardown;
  }, [ref, once, offset]);

  return inView;
}
