import { dashboardPath } from "@/lib/dashboard";

export type LandingRedirectUser = {
  id: string;
} | null;

export type LandingRedirectProfile = {
  clerkId: string | null;
} | null;

export function getAuthenticatedLandingRedirect(
  user: LandingRedirectUser,
  profile: LandingRedirectProfile,
  options: { onboardingPath?: string } = {}
) {
  if (!user) return null;
  if (profile?.clerkId) return dashboardPath(profile.clerkId);
  return options.onboardingPath ?? "/onboarding/connect";
}

export function getDashboardSlugRedirect(input: {
  clerkUserId?: string | null;
  profileClerkId?: string | null;
  requestedSlug?: string | null;
}) {
  if (!input.clerkUserId) return "/sign-in";
  if (!input.profileClerkId) return "/dashboard";
  if (input.requestedSlug && input.requestedSlug !== input.profileClerkId) {
    return dashboardPath(input.profileClerkId);
  }
  return null;
}
