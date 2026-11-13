import { NextResponse, type NextRequest } from "next/server";

/* search.tubelight.net shares this app with tubelight.net. On the search.* host, "/" shows the
   Quick Search AI page (app/search). Every other host and path is left exactly as it was. */
export function middleware(request: NextRequest) {
  const host = (request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? "").toLowerCase();
  if (host.startsWith("search.")) {
    const url = request.nextUrl.clone();
    url.pathname = "/search";
    return NextResponse.rewrite(url);
  }
  return NextResponse.next();
}

export const config = { matcher: ["/"] };
