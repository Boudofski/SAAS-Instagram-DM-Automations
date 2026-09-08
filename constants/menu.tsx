import { CreditCard, Gift, Home, Inbox, Settings, Sparkles, UsersRound, Workflow } from "lucide-react";

export const PRIMARY_NAVIGATION = [
  { icon: Home, label: "Home", segment: "" },
  { icon: UsersRound, label: "Contacts", segment: "contacts" },
  { icon: Workflow, label: "Automations", segment: "automation" },
  { icon: Sparkles, label: "AP3K AI", segment: "ai" },
  { icon: Inbox, label: "Inbox", segment: "inbox" },
  { icon: CreditCard, label: "Billing", segment: "billing" },
  { icon: Gift, label: "Refer & earn", segment: "referrals" },
  { icon: Settings, label: "Settings", segment: "settings" },
] as const;

export function primaryNavigationHref(slug: string, segment: string) {
  return `/dashboard/${slug}${segment ? `/${segment}` : ""}`;
}
