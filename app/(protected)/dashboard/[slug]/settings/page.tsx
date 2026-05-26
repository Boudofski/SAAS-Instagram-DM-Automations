import ThemeToggle from "@/components/global/theme-toggle";
import { onUserInfo } from "@/actions/user";
import { getAccountDangerZoneState, getEmailSettingsState, getMcpAccessTokenState, getPasswordSettingsState } from "@/lib/settings-safety";
import { SignOutButton } from "@clerk/nextjs";
import { KeyRound, Lock, Mail, Palette, ShieldAlert, Sparkles } from "lucide-react";
import type { ReactNode } from "react";

async function SettingsPage() {
  const userResult = await onUserInfo();
  const user = userResult.status === 200 ? userResult.data : null;
  const emailState = getEmailSettingsState(user?.email);
  const passwordState = getPasswordSettingsState();
  const mcpState = getMcpAccessTokenState();
  const dangerState = getAccountDangerZoneState();

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-5 px-1 py-4 text-slate-950 dark:text-slate-50 sm:px-2 lg:py-8">
      <div>
        <p className="ap3k-kicker">Preferences</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 dark:text-white">Settings</h1>
        <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">Manage your AP3k account appearance and credentials.</p>
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

      <SettingsSection icon={<Mail className="h-4.5 w-4.5" />} label="Email">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <div className="min-w-0 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-white/10 dark:bg-white/[0.04]">
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Signed-in email</p>
            <p className="mt-1 truncate text-sm font-black text-slate-800 dark:text-slate-100">{emailState.email}</p>
          </div>
          <button
            type="button"
            disabled
            className="h-10 cursor-not-allowed rounded-xl border border-slate-200 bg-slate-100 px-4 text-sm font-bold text-slate-400 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-500"
          >
            {emailState.label}
          </button>
        </div>
        <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">
          Email is managed by your sign-in provider and cannot be changed here.
        </p>
      </SettingsSection>

      <SettingsSection icon={<KeyRound className="h-4.5 w-4.5" />} label="Password">
        <div className="grid gap-3">
          <ReadOnlyInput label="Current password" value={passwordState.helper} />
          <ReadOnlyInput label="New password" value="Use your provider account settings" />
          <button
            type="button"
            disabled
            className="mt-1 h-10 w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-100 px-4 text-sm font-bold text-slate-400 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-500 sm:w-fit"
          >
            {passwordState.label}
          </button>
        </div>
      </SettingsSection>

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

      <section className="rounded-2xl border border-red-200 bg-red-50/80 p-5 dark:border-red-500/25 dark:bg-red-500/[0.07] sm:p-6">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-red-200 bg-white text-red-600 dark:border-red-500/25 dark:bg-white/[0.04] dark:text-red-300">
            <ShieldAlert className="h-4.5 w-4.5" />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-red-600 dark:text-red-300">Danger zone</p>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-red-800 dark:text-red-200">
              To delete your AP3k account and associated data, contact support. Self-service deletion is not yet enabled.
            </p>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                disabled
                className="cursor-not-allowed rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-bold text-red-400 opacity-70 dark:border-red-500/25 dark:bg-white/[0.04] dark:text-red-400"
              >
                {dangerState.label}
              </button>
              <SignOutButton redirectUrl="/">
                <button
                  type="button"
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-200 dark:hover:bg-white/[0.08]"
                >
                  Sign out
                </button>
              </SignOutButton>
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

function ReadOnlyInput({ label, value }: { label: string; value: string }) {
  return (
    <label className="grid gap-1.5">
      <span className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">{label}</span>
      <span className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-400 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-500">
        <Lock className="h-3.5 w-3.5 shrink-0" />
        {value}
      </span>
    </label>
  );
}
