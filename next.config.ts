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
    async headers() {
      return [
        {
          source: "/:section(previews|login|users|checkout)/:path*",
          headers: [{ key: "X-Robots-Tag", value: "noindex" }],
        },
      ];
    },
    // Relative beforeFiles rewrites stay inside Next even when nginx terminates
    // HTTPS and the standalone server binds a different internal hostname.
    async rewrites() {
      const searchHost = {
        type: "header" as const,
        key: "x-forwarded-host",
        value: "search\\.(?:tubelight\\.net|localhost)(?::[0-9]+)?",
      };
      return {
        beforeFiles: [
          { source: "/", has: [searchHost], destination: "/search" },
          { source: "/llms.txt", has: [searchHost], destination: "/search/product.txt" },
          { source: "/llms-full.txt", has: [searchHost], destination: "/search/product-full.txt" },
        ],
      };
    },
  };
}
