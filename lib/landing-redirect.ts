import { dashboardPath } from "@/lib/dashboard";
import type { InstagramIntegrationStatusBase } from "@/lib/instagram-integration-status";

export type LandingRedirectUser = {
  id: string;
} | null;

export type LandingRedirectProfile = {
  clerkId: string | null;
  integrations?: InstagramIntegrationStatusBase[] | null;
  automations?: unknown[] | null;
} | null;

export function getAuthenticatedLandingRedirect(
  user: LandingRedirectUser,
  profile: LandingRedirectProfile,
) {
  if (!user) return null;
  return dashboardPath(profile?.clerkId);
}
