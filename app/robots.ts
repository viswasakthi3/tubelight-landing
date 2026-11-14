import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { siteForHost } from "@/lib/site-host";

export const dynamic = "force-dynamic";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const site = siteForHost(await headers());
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/checkout"] },
    sitemap: site + "/sitemap.xml",
  };
}
