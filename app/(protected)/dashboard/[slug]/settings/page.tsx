import { onUserInfo } from "@/actions/user";
import ThemeToggle from "@/components/global/theme-toggle";
import { DeleteAccountButton } from "@/components/settings/delete-account-button";
import { ManageSignInSettings } from "@/components/settings/manage-sign-in-settings";
import { getEmailSettingsState } from "@/lib/settings-safety";
import { LockKeyhole, Palette, ShieldAlert } from "lucide-react";
import type { ReactNode } from "react";

async function SettingsPage() {
  const userResult = await onUserInfo();
  const user = userResult.status === 200 ? userResult.data : null;
  const emailState = getEmailSettingsState(user?.email);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-1 py-4 text-slate-950 dark:text-slate-50 sm:px-2 lg:py-6">
      <div className="animate-[ap3kDashboardRise_0.4s_ease-out_both]">
        <p className="ap3k-kicker">Preferences</p>
        <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-950 dark:text-white sm:text-3xl">Settings</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Appearance, sign-in, and account controls.</p>
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-[0.78fr_1.22fr]">
        <SettingsSection icon={<Palette className="h-4.5 w-4.5" />} label="Appearance">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between lg:flex-col lg:items-start">
            <div>
              <h2 className="text-sm font-black text-slate-950 dark:text-white">Theme</h2>
              <p className="mt-0.5 text-xs leading-5 text-slate-500 dark:text-slate-400">Switch AP3K between light and dark mode.</p>
            </div>
            <ThemeToggle />
          </div>
        </SettingsSection>

        <SettingsSection icon={<LockKeyhole className="h-4.5 w-4.5" />} label="Account & authentication">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Signed-in email</p>
              <p className="mt-1 truncate text-sm font-black text-slate-800 dark:text-slate-100">{emailState.email}</p>
              <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">Password and sign-in security are managed by your authentication provider.</p>
            </div>
            <ManageSignInSettings />
          </div>
        </SettingsSection>
      </div>

      <section className="animate-[ap3kDashboardRise_0.6s_ease-out_both] rounded-2xl border border-red-200 bg-red-50/70 p-4 dark:border-red-500/25 dark:bg-red-500/[0.07] sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-red-200 bg-white text-red-600 dark:border-red-500/25 dark:bg-white/[0.04] dark:text-red-300">
            <ShieldAlert className="h-4.5 w-4.5" />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-red-600 dark:text-red-300">Danger zone</p>
              <p className="mt-1 max-w-2xl text-xs leading-5 text-red-800 dark:text-red-200">Permanently delete your automations, Instagram data, leads, billing profile, and sign-in account.</p>
            </div>
          </div>
          <div className="shrink-0"><DeleteAccountButton email={emailState.email} /></div>
        </div>
      </section>
    </div>
  );
}

export default SettingsPage;

function SettingsSection({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <section className="ap3k-card animate-[ap3kDashboardRise_0.5s_ease-out_both] rounded-2xl p-4 transition-all duration-300 hover:-translate-y-0.5 sm:p-5">
      <div className="mb-4 flex items-center gap-2.5 border-b border-slate-100 pb-3 dark:border-white/[0.06]">
        <span className="grid h-8 w-8 place-items-center rounded-xl border border-slate-200 bg-slate-50 text-rf-pink dark:border-white/10 dark:bg-white/[0.04]">{icon}</span>
        <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-600 dark:text-slate-300">{label}</p>
      </div>
      {children}
    </section>
  );
}
