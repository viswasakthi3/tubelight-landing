import type { NextConfig } from "next";
import { PHASE_DEVELOPMENT_SERVER } from "next/constants";

// `next dev` and `next build` each write their own output folder. When both shared `.next`,
// running a build while the dev server was up deleted the dev chunks and the page failed with
// "Cannot find module './611.js'".
export default function config(phase: string): NextConfig {
  return {
    reactStrictMode: true,
    output: "standalone",
    distDir: phase === PHASE_DEVELOPMENT_SERVER ? ".next-dev" : ".next",
  };
}
