"use client";
import { useEffect } from "react";
import { useTheme } from "next-themes";
import { PanelLeft } from "lucide-react";
import AutomationAnalyticsView from "@/components/automations/automation-analytics";
import type { AutomationAnalytics } from "@/lib/automation-analytics";
export default function Review({ dark, populated }: { dark: boolean; populated: boolean }) {
  const { setTheme } = useTheme();
  useEffect(() => setTheme(dark ? "dark" : "light"), [dark, setTheme]);
  const data: AutomationAnalytics = {
    automation: { id: "00000000-0000-0000-0000-000000000001", name: "Link Delivery DM", active: true, createdAt: "2026-09-26T00:00:00Z", source: "COMMENT", followGateRequired: true, postThumbnail: null, responseCount: 10, messageType: "Button Text" },
    totals: { hits: populated ? 120 : 0, uniqueHitRecipients: populated ? 100 : 0, clicks: populated ? 64 : 0, eligibleNonFollowers: populated ? 40 : 0, newFollowers: populated ? 18 : 0, clickRate: populated ? 64 : 0, followRate: populated ? 45 : 0 },
    daily: Array.from({ length: 7 }, (_, i) => ({ date: `2026-09-${21 + i}`, hits: populated ? [0, 5, 12, 20, 15, 28, 40][i] : 0, clicks: populated ? [0, 3, 6, 12, 6, 17, 20][i] : 0 })),
    countries: populated ? [{ country: "MA", clicks: 40 }, { country: "FR", clicks: 24 }] : [],
    recent: { hits: populated ? [{ id: "h", recipient: "••••1234", createdAt: "2026-09-27T06:00:00Z", source: "COMMENT" }] : [], clicks: populated ? [{ id: "c", recipient: "••••1234", createdAt: "2026-09-27T06:05:00Z", country: "MA" }] : [], follows: populated ? [{ id: "f", recipient: "••••1234", createdAt: "2026-09-27T06:10:00Z" }] : [] },
    trackingStartedAt: populated ? "2026-09-21T00:00:00Z" : null,
  };
  return <div><nav className="aa-toolbar flex items-center gap-3 bg-white text-base font-semibold text-slate-800 dark:text-slate-100"><PanelLeft size={18} /><span>Automations</span><span>/</span><span>Analytics</span></nav><AutomationAnalyticsView data={data} slug="review" /></div>;
}
