import { CreditCard, Gift, Home, Inbox, Instagram, Settings, Workflow } from "lucide-react";

export const PRIMARY_NAVIGATION = [
  { icon: Home, label: "Home", segment: "" },
  { icon: Workflow, label: "Automations", segment: "automation" },
  { icon: Inbox, label: "Inbox", segment: "inbox" },
  { icon: Instagram, label: "Instagram Account", segment: "account" },
  { icon: CreditCard, label: "Billing", segment: "billing" },
  { icon: Gift, label: "Refer & earn", segment: "referrals" },
  { icon: Settings, label: "Settings", segment: "settings" },
] as const;

export function primaryNavigationHref(slug: string, segment: string) {
  return `/dashboard/${slug}${segment ? `/${segment}` : ""}`;
}
