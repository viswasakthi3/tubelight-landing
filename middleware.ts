import { NextResponse, type NextRequest } from "next/server";
import { SEARCH_SITE, siteForHost } from "./lib/site-host";

export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  const host = (request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? "").split(",")[0].trim().toLowerCase().split(":")[0];
  const search = siteForHost(request.headers) === SEARCH_SITE;
  if (url.pathname === "/search" && (search || ["www.tubelight.net", "tubelight.net"].includes(host))) {
    return NextResponse.redirect(new URL("/" + url.search, SEARCH_SITE), 308);
  }
  if (search && (url.pathname === "/" || url.pathname === "/llms.txt")) {
    url.pathname = url.pathname === "/" ? "/search" : "/search/product.txt";
    return NextResponse.rewrite(url);
  }
  return NextResponse.next();
}

export const config = { matcher: ["/", "/search", "/llms.txt"] };
