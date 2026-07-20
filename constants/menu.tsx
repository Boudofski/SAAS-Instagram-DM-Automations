import { CreditCard, Home, Instagram, Megaphone, Settings } from "lucide-react";

export const PRIMARY_NAVIGATION = [
  { icon: Home, label: "Home", segment: "" },
  { icon: Megaphone, label: "Campaigns", segment: "automation" },
  { icon: Instagram, label: "Instagram Account", segment: "account" },
  { icon: CreditCard, label: "Billing", segment: "billing" },
  { icon: Settings, label: "Settings", segment: "settings" },
] as const;

export function primaryNavigationHref(slug: string, segment: string) {
  return `/dashboard/${slug}${segment ? `/${segment}` : ""}`;
}
