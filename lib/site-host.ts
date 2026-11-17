export const MAIN_SITE = "https://tubelight.net";
export const SEARCH_SITE = "https://search.tubelight.net";

export const SEARCH_HOSTS = new Set(["search.tubelight.net", "search.localhost"]);
export const MAIN_HOSTS = new Set(["tubelight.net", "www.tubelight.net", "localhost"]);

export function cleanHost(headers: Pick<Headers, "get">): string {
  return (headers.get("x-forwarded-host") ?? headers.get("host") ?? "")
    .split(",")[0]
    .trim()
    .toLowerCase()
    .split(":")[0];
}

export function isSearchHost(headers: Pick<Headers, "get">): boolean {
  const host = cleanHost(headers);
  return SEARCH_HOSTS.has(host);
}

export function siteForHost(headers: Pick<Headers, "get">): string {
  return isSearchHost(headers) ? SEARCH_SITE : MAIN_SITE;
}
