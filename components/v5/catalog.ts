import type { VideoMap } from "@/lib/video-paths";

/* typed = the exact words someone typed into Tubelight to make each video (from the saved library) */
export type GalleryItem = { slug: string; tag: string; bg: string; fg: string; typed: string; kw: string };

export const GALLERY: GalleryItem[] = [
  { slug: "rocket", tag: "Science", bg: "#FFEDE7", fg: "#A63A1E", typed: "how rocket engine works", kw: "rocket rockets engine engines space fuel thrust nozzle launch physics" },
  { slug: "headaches", tag: "Health", bg: "#E3F6EC", fg: "#146B44", typed: "why headaches happen", kw: "headache headaches migraine brain pain head health" },
  { slug: "ocean", tag: "Geography", bg: "#E6F1FF", fg: "#1E5AA8", typed: "Ocean currents", kw: "ocean oceans current currents sea water coriolis climate geography" },
  { slug: "tv", tag: "Tech", bg: "#F1ECFF", fg: "#4B33B8", typed: "how does modern tv worsk so good and high in quality", kw: "tv television screen oled led pixels display picture tech" },
  { slug: "polar-bear", tag: "Nature", bg: "#FFF4D6", fg: "#8A5A00", typed: "life cycle of a polar bear", kw: "polar bear bears arctic animal animals cubs ice nature" },
  { slug: "insurance", tag: "Money", bg: "#FFEDE7", fg: "#A63A1E", typed: "how lic policy works", kw: "insurance lic policy premium money finance life" },
];

/* other ready-made videos that search can find (they play from the features section) */
export const MORE: { slug: string; kw: string }[] = [
  { slug: "kidneys", kw: "kidney kidneys blood filter urine nephron bladder body medical" },
  { slug: "zombie-cells", kw: "zombie senescent cell cells ageing aging inflammation medical" },
  { slug: "neurons", kw: "neuron neurons memory memories brain synapse learning" },
  { slug: "appendix", kw: "appendix gut bacteria intestine digestion body medical" },
  { slug: "supernova", kw: "supernova star stars black hole holes space explosion" },
  { slug: "dark-matter", kw: "dark matter galaxy galaxies gravity space universe" },
];

export const SAVED = ["neurons", "appendix", "supernova", "dark-matter"];

const STOP: Record<string, number> = { the: 1, how: 1, why: 1, what: 1, does: 1, and: 1, are: 1, for: 1, with: 1, about: 1, work: 1, works: 1, that: 1, this: 1, from: 1, into: 1, your: 1, explain: 1, teach: 1 };

export function words(t: string): string[] {
  return String(t || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP[w]);
}

export type Match = { slug: string; score: number };

/** Ready-made videos whose title, typed topic, tag or keywords match the words of the query, best first. */
export function findMatches(query: string, videos: VideoMap): Match[] {
  const ws = words(query);
  if (!ws.length) return [];
  const pool: { slug: string; typed?: string; tag?: string; kw: string }[] = [...GALLERY, ...MORE];
  return pool
    .map((g) => {
      const v = videos[g.slug];
      if (!v) return { slug: g.slug, score: 0 };
      const hay = " " + words(v.title + " " + (g.typed || "") + " " + (g.tag || "") + " " + g.kw).join(" ") + " ";
      let score = 0;
      ws.forEach((x) => {
        if (hay.indexOf(" " + x) >= 0) score++;
      });
      return { slug: g.slug, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);
}
