import { updateEmailPreferencesAction } from "@/actions/email-preferences";

type Props = {
  preferences: {
    productTips: boolean;
    weeklyReports: boolean;
    promotions: boolean;
  };
};

const options = [
  { name: "productTips", title: "Setup and product guidance", detail: "Useful reminders that help you connect Instagram, finish an automation, and use AP3K well." },
  { name: "weeklyReports", title: "Weekly performance report", detail: "A concise summary of replies, DMs, leads, and comment activity." },
  { name: "promotions", title: "Offers and product announcements", detail: "Occasional AP3K promotions and major feature announcements. Off by default." },
] as const;

export function EmailPreferences({ preferences }: Props) {
  return (
    <form id="email-preferences" action={updateEmailPreferencesAction} className="scroll-mt-6 space-y-4">
      <div className="space-y-2">
        {options.map((option) => (
          <label key={option.name} className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-3 transition hover:border-violet-300 dark:border-white/[0.07] dark:bg-white/[0.025] dark:hover:border-violet-400/30">
            <input
              type="checkbox"
              name={option.name}
              defaultChecked={preferences[option.name]}
              className="mt-1 h-4 w-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
            />
            <span className="min-w-0">
              <span className="block text-xs font-black text-slate-900 dark:text-white">{option.title}</span>
              <span className="mt-1 block text-[11px] leading-5 text-slate-500 dark:text-slate-400">{option.detail}</span>
            </span>
          </label>
        ))}
      </div>
      <p className="text-[11px] leading-5 text-slate-500 dark:text-slate-400">Security, account connection, automation failure, usage-limit, support, and billing emails cannot be disabled because they protect the service you asked AP3K to run.</p>
      <button type="submit" className="rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-500 px-4 py-2.5 text-xs font-black text-white shadow-lg shadow-violet-600/15 transition hover:-translate-y-0.5 hover:shadow-violet-600/25">Save email preferences</button>
    </form>
  );
}
