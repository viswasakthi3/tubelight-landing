import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { siteForHost } from "@/lib/site-host";

export const dynamic = "force-dynamic";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const site = siteForHost(await headers());
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/checkout"],
      },
      {
        userAgent: [
          "GPTBot",
          "ChatGPT-User",
          "OAI-SearchBot",
          "ClaudeBot",
          "Claude-Web",
          "anthropic-ai",
          "PerplexityBot",
          "Google-Extended",
          "Applebot-Extended",
          "cohere-ai",
          "CCBot",
        ],
        allow: [
          "/",
          "/llms.txt",
          "/llms-full.txt",
          "/search/product.txt",
          "/search/product-full.txt",
        ],
        disallow: ["/api/", "/checkout"],
      },
    ],
    sitemap: `${site}/sitemap.xml`,
  };
}
