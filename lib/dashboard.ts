export function dashboardPath(clerkId?: string | null) {
  return clerkId ? `/dashboard/${encodeURIComponent(clerkId)}` : "/dashboard";
}
