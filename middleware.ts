import { NextRequest, NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "./src/i18n/routing";

const intlMiddleware = createMiddleware(routing);

export default function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  // Check if the path already has a locale prefix
  const hasLocalePrefix = pathname.startsWith("/ar/") || pathname.startsWith("/en/");
  
  // If root path or no locale prefix, redirect to Arabic
  if (pathname === "/" || (!hasLocalePrefix && !pathname.startsWith("/api/") && !pathname.startsWith("/_next/") && !pathname.startsWith("/_vercel/") && !pathname.includes("."))) {
    const url = new URL("/ar" + (pathname === "/" ? "" : pathname), request.url);
    return NextResponse.redirect(url);
  }
  
  // For all other cases, use the intl middleware
  return intlMiddleware(request);
}

export const config = {
  matcher: ["/", "/((?!api|_next|_vercel|.*\\..*).*)"],
};
