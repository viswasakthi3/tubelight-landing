import type { MetadataRoute } from "next";
import { MAIN_SITE, QUICK_SEARCH_URL } from "@/lib/site-host";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: `${MAIN_SITE}/`,
      images: [`${MAIN_SITE}/shots/social-preview.jpg`],
    },
    {
      url: QUICK_SEARCH_URL,
      images: [`${MAIN_SITE}/search/card.png`],
    },
    { url: `${MAIN_SITE}/download` },
    { url: `${MAIN_SITE}/upgrade` },
  ];
}
