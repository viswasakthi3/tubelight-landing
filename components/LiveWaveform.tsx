"use client";

import { useRef } from "react";
import { useInViewport } from "@/lib/useInViewport";

const BARS = [8, 15, 24, 12, 30, 18, 10, 22, 34, 16, 9, 20, 28, 13, 7, 17, 26, 11, 19, 30, 14, 8, 21, 12];

export function LiveWaveform({ className = "", color = "bg-violet" }: { className?: string; color?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInViewport(ref, { offset: 20 });

  return (
    <div ref={ref} className={`flex items-center gap-[3px] ${className}`} aria-hidden="true">
      {BARS.map((h, i) => (
        <span
          key={i}
          className={`w-[3px] shrink-0 rounded-full ${color}`}
          style={{
            height: `${h}px`,
            opacity: inView ? 1 : 0.4,
            animation: inView ? `eq ${700 + (i % 6) * 120}ms ease-in-out ${i * 55}ms infinite` : "none",
          }}
        />
      ))}
    </div>
  );
}
