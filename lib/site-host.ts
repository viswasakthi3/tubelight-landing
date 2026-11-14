export const MAIN_SITE = "https://tubelight.net";
export const SEARCH_SITE = "https://search.tubelight.net";

export function siteForHost(headers: Pick<Headers, "get">) {
  const host = (headers.get("x-forwarded-host") ?? headers.get("host") ?? "").split(",")[0].trim().toLowerCase().split(":")[0];
  return host.startsWith("search.") ? SEARCH_SITE : MAIN_SITE;
}
