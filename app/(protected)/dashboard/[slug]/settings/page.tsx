import { onUserInfo } from "@/actions/user";
import ThemeToggle from "@/components/global/theme-toggle";
import { DeleteAccountButton } from "@/components/settings/delete-account-button";
import { ManageSignInSettings } from "@/components/settings/manage-sign-in-settings";
import { isAppReviewMode } from "@/lib/app-review-mode";
import { getEmailSettingsState, getMcpAccessTokenState } from "@/lib/settings-safety";
import { LockKeyhole, Palette, ShieldAlert, Sparkles } from "lucide-react";
import type { ReactNode } from "react";

async function SettingsPage() {
  const userResult = await onUserInfo();
  const user = userResult.status === 200 ? userResult.data : null;
  const emailState = getEmailSettingsState(user?.email);
  const mcpState = getMcpAccessTokenState();
  const appReviewMode = isAppReviewMode();

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-5 px-1 py-4 text-slate-950 dark:text-slate-50 sm:px-2 lg:py-8">
      <div>
        <p className="ap3k-kicker">Preferences</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 dark:text-white">Settings</h1>
        <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">Manage your AP3k account appearance and sign-in preferences.</p>
      </div>

      <SettingsSection icon={<Palette className="h-4.5 w-4.5" />} label="Appearance">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-black text-slate-950 dark:text-white">Theme</h2>
            <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">Choose light, dark, or match your system preference.</p>
          </div>
          <ThemeToggle />
        </div>
      </SettingsSection>

      <SettingsSection icon={<LockKeyhole className="h-4.5 w-4.5" />} label="Account & authentication">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <div className="min-w-0 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-white/10 dark:bg-white/[0.04]">
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Signed-in email</p>
            <p className="mt-1 truncate text-sm font-black text-slate-800 dark:text-slate-100">{emailState.email}</p>
            <p className="mt-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              Email, password, connected sign-in methods, and account security are managed by your sign-in provider.
            </p>
          </div>
          <ManageSignInSettings />
        </div>
      </SettingsSection>

      {!appReviewMode && (
        <SettingsSection icon={<Sparkles className="h-4.5 w-4.5" />} label="MCP / Personal Access Tokens">
          <div className="flex flex-col gap-4 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-500/20 dark:bg-amber-500/[0.07] sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="text-sm font-black text-amber-900 dark:text-amber-200">Coming soon</p>
              <p className="mt-1 max-w-lg text-sm leading-relaxed text-amber-800/80 dark:text-amber-300/80">
                Connect Claude, ChatGPT, or any MCP-aware AI client directly to your AP3k account via a personal access token. Final testing in progress.
              </p>
            </div>
            <span className="ap3k-badge ap3k-badge-amber shrink-0">{mcpState.badge}</span>
          </div>
        </SettingsSection>
      )}

      <section className="rounded-2xl border border-red-200 bg-red-50/80 p-5 dark:border-red-500/25 dark:bg-red-500/[0.07] sm:p-6">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-red-200 bg-white text-red-600 dark:border-red-500/25 dark:bg-white/[0.04] dark:text-red-300">
            <ShieldAlert className="h-4.5 w-4.5" />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-red-600 dark:text-red-300">Danger zone</p>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-red-800 dark:text-red-200">
              Permanently remove your AP3K campaigns, connected Instagram accounts, leads, activity, billing profile, and sign-in account. This cannot be undone.
            </p>
            <div className="mt-4">
              <DeleteAccountButton email={emailState.email} />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default SettingsPage;

function SettingsSection({
  icon,
  label,
  children,
}: {
  icon: ReactNode;
  label: string;
  children: ReactNode;
}) {
  return (
    <section className="ap3k-card rounded-2xl p-5 sm:p-6">
      <div className="mb-5 flex items-center gap-2.5 border-b border-slate-100 pb-4 dark:border-white/[0.06]">
        <span className="grid h-8 w-8 place-items-center rounded-xl border border-slate-200 bg-slate-50 text-rf-pink dark:border-white/10 dark:bg-white/[0.04]">
          {icon}
        </span>
        <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-600 dark:text-slate-300">{label}</p>
      </div>
      {children}
    </section>
  );
}
