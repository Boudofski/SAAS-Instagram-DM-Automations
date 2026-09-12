import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { getAuthenticatedHomeRedirect } from "@/lib/authenticated-home-redirect";
import { NextResponse } from "next/server";

const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/onboarding(.*)",
  "/admin(.*)",
  "/ap3k-admin(.*)",
  "/api/payment(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  if (req.nextUrl.pathname === "/") {
    const { userId } = await auth();
    const destination = getAuthenticatedHomeRedirect(req.nextUrl.pathname, userId);

    if (destination) {
      return NextResponse.redirect(new URL(destination, req.url));
    }
  }

  if (isProtectedRoute(req)) await auth.protect();
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
