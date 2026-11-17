"use client";

import { useRef, useState } from "react";
import { Back, Fwd } from "./icons";

type Shot = { id: string; src: string; title: string; alt: string };

export function ShotsCarousel({ shots }: { shots: Shot[] }) {
  const track = useRef<HTMLDivElement>(null);
  const [current, setCurrent] = useState(0);

  function goTo(index: number) {
    const viewport = track.current;
    if (!viewport) return;
    const next = (index + shots.length) % shots.length;
    viewport.scrollTo({
      left: next * viewport.clientWidth,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
    });
  }

  return (
    <div className="qs-carousel" role="region" aria-roledescription="carousel" aria-labelledby="shots-h">
      <div
        className="qs-carousel-track"
        id="qs-tour-slides"
        ref={track}
        tabIndex={0}
        aria-label="Product screenshots. Use the arrow keys to browse."
        onScroll={(event) => {
          const viewport = event.currentTarget;
          setCurrent(Math.round(viewport.scrollLeft / viewport.clientWidth));
        }}
        onKeyDown={(event) => {
          if (event.target !== event.currentTarget) return;
          const destinations: Record<string, number> = {
            ArrowLeft: current - 1,
            ArrowRight: current + 1,
            Home: 0,
            End: shots.length - 1,
          };
          if (event.key in destinations) {
            event.preventDefault();
            goTo(destinations[event.key]);
          }
        }}
      >
        {shots.map((shot, index) => (
          <div className="qs-carousel-slide" key={shot.id} role="group" aria-roledescription="slide" aria-label={`${index + 1} of ${shots.length}: ${shot.title}`}>
            <img src={shot.src} alt={shot.alt} width={1920} height={1080} loading="lazy" decoding="async" />
          </div>
        ))}
      </div>
      <div className="qs-carousel-footer">
        <div className="qs-carousel-caption" aria-live="polite" aria-atomic="true">
          <span className="qs-carousel-count">{String(current + 1).padStart(2, "0")} / {String(shots.length).padStart(2, "0")}</span>
          <h3>{shots[current].title}</h3>
        </div>
        <div className="qs-carousel-controls">
          <button type="button" className="qs-carousel-prev" onClick={() => goTo(current - 1)} aria-label="Previous screenshot" aria-controls="qs-tour-slides"><Back size={20} /></button>
          <button type="button" className="qs-carousel-next" onClick={() => goTo(current + 1)} aria-label="Next screenshot" aria-controls="qs-tour-slides">Next<Fwd size={20} /></button>
        </div>
      </div>
      <div className="qs-carousel-dots" role="group" aria-label="Choose a screenshot">
        {shots.map((shot, index) => (
          <button type="button" key={shot.id} aria-label={`Show screenshot ${index + 1}: ${shot.title}`} aria-current={current === index ? "true" : undefined} aria-controls="qs-tour-slides" onClick={() => goTo(index)}><span /></button>
        ))}
      </div>
    </div>
  );
}
