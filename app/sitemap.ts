import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { SEARCH_SITE, siteForHost } from "@/lib/site-host";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const site = siteForHost(await headers());
  const paths = site === SEARCH_SITE ? ["/"] : ["/", "/download", "/upgrade"];
  return paths.map((path) => ({ url: site + path }));
}
