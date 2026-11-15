import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { MAIN_SITE, SEARCH_SITE, siteForHost } from "@/lib/site-host";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const site = siteForHost(await headers());
  const now = new Date();

  if (site === SEARCH_SITE) {
    return [
      {
        url: `${SEARCH_SITE}/`,
        lastModified: now,
        changeFrequency: "daily",
        priority: 1.0,
        images: [
          `${SEARCH_SITE}/search/card.png`,
          `${SEARCH_SITE}/search/shots/qs-01-hold-tab-q.png`,
          `${SEARCH_SITE}/search/shots/qs-02-hold-ask-let-go.png`,
          `${SEARCH_SITE}/search/shots/qs-03-stop-opening-tabs.png`,
          `${SEARCH_SITE}/search/shots/qs-04-highlight-a-word.png`,
          `${SEARCH_SITE}/search/shots/qs-05-ask-about-your-screen.png`,
          `${SEARCH_SITE}/search/shots/qs-06-one-answer-with-proof.png`,
          `${SEARCH_SITE}/search/shots/qs-07-free-50-a-day.png`,
        ],
      },
    ];
  }

  return [
    {
      url: `${MAIN_SITE}/`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1.0,
      images: [
        `${MAIN_SITE}/shots/social-preview.jpg`,
        `${MAIN_SITE}/brand/icon-512.png`,
      ],
    },
    {
      url: `${MAIN_SITE}/download`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${MAIN_SITE}/upgrade`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
  ];
}
