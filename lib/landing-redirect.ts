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
