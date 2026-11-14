"use client";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import { useI18n } from "@/providers/i18n-provider";
import { EMAIL_COPY } from "@/lib/email/locale-copy";
import { requestUpgradeForResult } from "@/lib/upgrade-prompt";
export default function UsageBanner() {
  const { user } = useUser();
  const { locale } = useI18n();
  const copy = EMAIL_COPY[locale];
  const { data } = useQuery<{ used: number; limit: number | "unlimited" }>({
    queryKey: ["usage-banner", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const response = await fetch("/api/account/usage");
      if (!response.ok) throw new Error("Usage unavailable");
      return response.json();
    },
    staleTime: 60000,
    refetchInterval: 300000,
  });
  if (
    !data ||
    data.limit === "unlimited" ||
    data.limit <= 0 ||
    data.used / data.limit < 0.8
  )
    return null;
  const reached = data.used >= data.limit;
  const title =
    locale === "en"
      ? reached
        ? "Monthly usage limit reached"
        : "You are approaching your monthly limit"
      : copy.titles[reached ? 7 : 6];
  const format = new Intl.NumberFormat(locale);
  return (
    <aside
      role="status"
      dir={locale === "ar" ? "rtl" : "ltr"}
      className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-300/60 bg-amber-50 p-4 text-amber-950 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-100"
    >
      <div className="min-w-0 flex-1">
        <p className="font-semibold">{title}</p>
        <p className="text-sm">
          <bdi>
            {format.format(data.used)} / {format.format(data.limit)}
          </bdi>{" "}
          · {copy.actions}
        </p>
        <p className="mt-1 text-xs">{copy.counting}</p>
      </div>
      <button
        type="button"
        className="rounded-lg bg-violet-700 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-800"
        onClick={() => requestUpgradeForResult({ code: "PLAN_LIMIT" })}
      >
        {copy.plans}
      </button>
    </aside>
  );
}
