import { NextResponse, type NextRequest } from "next/server";
import { isSearchHost, MAIN_SITE, SEARCH_SITE } from "./lib/site-host";

export function middleware(request: NextRequest) {
  if (isSearchHost(request.headers)) {
    if (request.nextUrl.pathname === "/sitemap.xml") {
      return NextResponse.redirect(new URL("/sitemap.xml", MAIN_SITE), 308);
    }
    if (request.nextUrl.pathname === "/search") {
      return NextResponse.redirect(new URL("/" + request.nextUrl.search, SEARCH_SITE), 308);
    }
  }

  // On main host (tubelight.net, www.tubelight.net, localhost):
  // /search serves the Quick Search page directly on apex, preserving query strings & SEO
  // / serves main marketing landing page
  return NextResponse.next();
}

export const config = { matcher: ["/search", "/sitemap.xml"] };
