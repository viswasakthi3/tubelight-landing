import { NextResponse, type NextRequest } from "next/server";
import { isSearchHost, SEARCH_SITE } from "./lib/site-host";

export function middleware(request: NextRequest) {
  if (isSearchHost(request.headers) && request.nextUrl.pathname === "/search") {
    // Redirects use the public canonical origin, never a container hostname.
    return NextResponse.redirect(new URL("/" + request.nextUrl.search, SEARCH_SITE), 308);
  }

  // On main host (tubelight.net, www.tubelight.net, localhost):
  // /search serves the Quick Search page directly on apex, preserving query strings & SEO
  // / serves main marketing landing page
  return NextResponse.next();
}

export const config = { matcher: ["/search"] };
