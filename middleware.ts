import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { getAuthenticatedHomeRedirect } from "@/lib/authenticated-home-redirect";
import {
  LOCALE_COOKIE,
  isProtectedPath,
  localeFromPath,
  stripLocaleFromPath,
  resolveRequestLocale,
} from "@/lib/i18n/config";
import { NextResponse } from "next/server";

const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/onboarding(.*)",
  "/admin(.*)",
  "/ap3k-admin(.*)",
  "/api/payment(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  const requestedPath = req.nextUrl.pathname;
  const pathLocale = localeFromPath(requestedPath);
  const pathname = stripLocaleFromPath(requestedPath);
  const hasDedicatedLocalizedRoute = requestedPath === "/ar/instagram-dm-automation";

  if (pathname === "/") {
    const { userId } = await auth();
    const destination = getAuthenticatedHomeRedirect(pathname, userId);

    if (destination) {
      return NextResponse.redirect(new URL(destination, req.url));
    }
  }

  if (pathLocale && isProtectedPath(pathname)) {
    const destination = req.nextUrl.clone();
    destination.pathname = pathname;
    const response = NextResponse.redirect(destination);
    response.cookies.set(LOCALE_COOKIE, pathLocale, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
    return response;
  }

  if (isProtectedRoute(req)) await auth.protect();

  const locale = resolveRequestLocale(requestedPath, req.cookies.get(LOCALE_COOKIE)?.value);
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-ap3k-locale", locale);

  if (pathLocale) {
    if (hasDedicatedLocalizedRoute) {
      const response = NextResponse.next({ request: { headers: requestHeaders } });
      return response;
    }
    const destination = req.nextUrl.clone();
    destination.pathname = pathname;
    const response = NextResponse.rewrite(destination, { request: { headers: requestHeaders } });
    return response;
  }

  return NextResponse.next({ request: { headers: requestHeaders } });
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
