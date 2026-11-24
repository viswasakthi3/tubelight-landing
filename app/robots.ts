import type { MetadataRoute } from "next";
import { MAIN_SITE } from "@/lib/site-host";

export default function robots(): MetadataRoute.Robots {
  const disallow = ["/api/", "/checkout"];
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow,
      },
      {
        userAgent: [
          "GPTBot",
          "ChatGPT-User",
          "OAI-SearchBot",
          "ClaudeBot",
          "Claude-SearchBot",
          "Claude-User",
          "Claude-Web",
          "anthropic-ai",
          "PerplexityBot",
          "Google-Extended",
          "Applebot-Extended",
          "cohere-ai",
          "CCBot",
        ],
        allow: "/",
        disallow,
      },
    ],
    sitemap: `${MAIN_SITE}/sitemap.xml`,
  };
}
