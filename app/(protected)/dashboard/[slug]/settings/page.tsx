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
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-1 py-4 text-slate-950 dark:text-slate-50 sm:px-2 lg:py-8">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.18em] text-pink-600">AP3k preferences</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 dark:text-white">Settings</h1>
        <p className="mt-2 text-sm font-bold text-slate-500 dark:text-slate-400">Manage your AP3k account preferences</p>
      </div>

      <SettingsSection icon={<Palette className="h-5 w-5" />} label="Appearance">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-black text-slate-950 dark:text-white">Theme</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Choose light, dark, or system appearance.</p>
          </div>
          <ThemeToggle />
        </div>
      </SettingsSection>

      <SettingsSection icon={<Mail className="h-5 w-5" />} label="Email">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <div className="min-w-0 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-white/10 dark:bg-white/[0.04]">
            <p className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Signed-in email</p>
            <p className="mt-1 truncate text-sm font-black text-slate-800 dark:text-slate-100">{emailState.email}</p>
          </div>
          <button
            type="button"
            disabled
            className="h-11 cursor-not-allowed rounded-xl border border-slate-200 bg-slate-100 px-4 text-sm font-black text-slate-400 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-500"
          >
            {emailState.label}
          </button>
        </div>
      </SettingsSection>

      <SettingsSection icon={<KeyRound className="h-5 w-5" />} label="Password">
        <div className="grid gap-3">
          <ReadOnlyInput label="Current password" value={passwordState.helper} />
          <ReadOnlyInput label="New password" value="Use your provider account settings" />
          <button
            type="button"
            disabled
            className="mt-1 h-11 w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-100 px-4 text-sm font-black text-slate-400 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-500 sm:w-fit"
          >
            {passwordState.label}
          </button>
        </div>
      </SettingsSection>

      <SettingsSection icon={<Sparkles className="h-5 w-5" />} label="MCP / Personal Access Tokens">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-3xl text-sm leading-relaxed text-slate-600 dark:text-slate-400">
            Connect Claude, ChatGPT, or MCP-aware AI clients to your AP3k account. We&apos;re putting the final touches on it.
          </p>
          <span className="w-fit rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-black uppercase text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
            {mcpState.badge}
          </span>
        </div>
      </SettingsSection>

      <section className="rounded-2xl border border-red-200 bg-red-50 p-5 dark:border-red-500/30 dark:bg-red-500/10 sm:p-6">
        <div className="flex items-start gap-3">
          <ShieldAlert className="mt-0.5 h-5 w-5 text-red-600 dark:text-red-300" />
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-red-600 dark:text-red-300">Danger zone</p>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-red-800 dark:text-red-100">
              To delete your AP3k account and associated data, contact support. Self-service account deletion is not enabled until the full deletion flow is audited.
            </p>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                disabled
                className="cursor-not-allowed rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-black text-red-400 opacity-70 dark:border-red-500/30 dark:bg-white/[0.04] dark:text-red-300"
              >
                {dangerState.label}
              </button>
              <SignOutButton redirectUrl="/">
                <button className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-black text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-200 dark:hover:bg-white/[0.08]">
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
      <div className="mb-5 flex items-center gap-2">
        <span className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 bg-slate-50 text-rf-pink dark:border-white/10 dark:bg-white/[0.04]">
          {icon}
        </span>
        <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">{label}</p>
      </div>
      {children}
    </section>
  );
}

function ReadOnlyInput({ label, value }: { label: string; value: string }) {
  return (
    <label className="grid gap-2">
      <span className="text-xs font-black uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">{label}</span>
      <span className="flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-400 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-500">
        <Lock className="h-4 w-4" />
        {value}
      </span>
    </label>
  );
}
