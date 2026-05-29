"use client";

import {
  getCurrentWebhookHealth,
  getInstagramConnectUrl,
  resubscribeCurrentInstagramWebhooks,
} from "@/actions/integration";
import { onUserInfo } from "@/actions/user";
import { Button } from "@/components/ui/button";
import { isAppReviewMode } from "@/lib/app-review-mode";
import { getCanonicalInstagramIntegration } from "@/lib/instagram-integration-status";
import { useAuth } from "@clerk/nextjs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import React from "react";
import { toast } from "sonner";
import { formatUserFacingMetaError } from "@/lib/user-facing-errors";

type Props = {
  title: string;
  description: string;
  icon: React.ReactNode;
  strategy: "INSTAGRAM" | "CRM";
  surface?: "dashboard" | "onboarding";
  continueHref?: string;
  canonicalConnected?: boolean;
  oauthSaveFailed?: boolean;
};

function IntegrationCard({ title, description, icon, strategy, surface = "dashboard", continueHref, canonicalConnected, oauthSaveFailed = false }: Props) {
  const [isConnecting, setIsConnecting] = React.useState(false);
  const { userId } = useAuth();
  const appReviewMode = isAppReviewMode();
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: ["user-profile", userId],
    queryFn: onUserInfo,
    enabled: Boolean(userId),
  });

  const { data: health } = useQuery({
    queryKey: ["webhook-health", userId],
    queryFn: getCurrentWebhookHealth,
    enabled: Boolean(userId) && strategy === "INSTAGRAM",
  });

  const resubscribe = useMutation({
    mutationKey: ["resubscribe-webhooks", userId],
    mutationFn: resubscribeCurrentInstagramWebhooks,
    onSuccess: async (result) => {
      if (result.status === 200) {
        toast.success(result.data);
      } else {
        toast.error(result.data ?? "Webhook resubscribe failed");
      }
      await queryClient.invalidateQueries({ queryKey: ["webhook-health", userId] });
    },
  });

  const integrated = strategy === "INSTAGRAM"
    ? getCanonicalInstagramIntegration(data?.data?.integrations)
    : data?.data?.integrations.find((i: any) => i.name === strategy);
  const isInstagram = strategy === "INSTAGRAM";
  const onboarding = surface === "onboarding";
  const connected = typeof canonicalConnected === "boolean" ? canonicalConnected : Boolean(integrated);
  const displayIntegration = connected ? integrated : null;
  const displayTitle = onboarding && connected ? "Instagram connected" : title;
  const displayDescription = onboarding
    ? connected
      ? "AP3k can now receive Instagram comments, send public replies, and track campaign activity for this account."
      : "AP3k connects through Meta's official login to receive Instagram comments, send public replies, and track campaign activity for the account you choose."
    : description;
  const lastFailure = formatUserFacingMetaError(
    health?.data?.subscription?.error ?? health?.data?.lastFailure?.errorMessage,
    health?.data?.lastFailure?.eventType
  );

  const onConnect = async () => {
    if (!isInstagram) return;

    setIsConnecting(true);
    try {
      const result = await getInstagramConnectUrl();
      if (result.status === 200 && result.url) {
        window.location.assign(result.url);
        return;
      }

      toast.error("Instagram connection could not be started.");
    } catch {
      toast.error("Instagram connection could not be started.");
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className={[
      "w-full rounded-2xl border border-slate-200 bg-white p-5 text-slate-950 shadow-sm transition-colors hover:border-rf-pink/30 dark:border-white/10 dark:bg-white/[0.04] dark:text-white",
      onboarding ? "sm:p-6" : "",
    ].join(" ")}>
      <div className="flex w-full flex-col gap-5 sm:flex-row sm:items-start">
        <div className="flex w-14 shrink-0 items-center justify-center self-start">{icon}</div>

        <div className="min-w-0 flex-1">
          <h3 className="text-xl font-black leading-tight sm:text-2xl">{displayTitle}</h3>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600 dark:text-slate-400">{displayDescription}</p>
          {displayIntegration?.instagramId && (
          <div className="mt-4 flex min-w-0 items-center gap-3 rounded-xl border border-emerald-100 bg-emerald-50 p-3 dark:border-emerald-500/25 dark:bg-emerald-500/10">
            {displayIntegration.profilePictureUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={displayIntegration.profilePictureUrl}
                alt={displayIntegration.instagramUsername ?? "Connected Instagram account"}
                className="h-12 w-12 shrink-0 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-ap3k-gradient text-xs font-black text-white">
                IG
              </div>
            )}
            <div className="min-w-0">
              <p className="truncate text-sm font-black text-rf-green">
                {displayIntegration.instagramUsername
                  ? `@${displayIntegration.instagramUsername}`
                  : "Instagram connected"}
              </p>
              {!appReviewMode && (
                <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">
                  IG business ID: {displayIntegration.instagramId}
                </p>
              )}
              {!appReviewMode && displayIntegration.pageId && (
                <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">
                  Page ID: {displayIntegration.pageId}
                </p>
              )}
            </div>
          </div>
          )}
        </div>

        <div className="flex w-full flex-col gap-2 sm:w-auto sm:min-w-52 sm:flex-wrap">
          {onboarding && connected && continueHref ? (
            <Link href={continueHref} className="ap3k-gradient-button inline-flex min-h-11 w-full items-center justify-center rounded-xl px-4 text-center text-sm font-black text-white">
              Create my first campaign
            </Link>
          ) : (
            <Button
              onClick={onConnect}
              disabled={!isInstagram || isConnecting}
              className="ap3k-gradient-button min-h-11 w-full px-4 text-white disabled:opacity-60"
            >
              {connected ? "Reconnect Instagram" : isConnecting ? "Connecting..." : "Connect Instagram"}
            </Button>
          )}
          {onboarding && connected && (
            <Button
              type="button"
              variant="outline"
              onClick={onConnect}
              disabled={!isInstagram || isConnecting}
              className="min-h-11 w-full border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-200 dark:hover:bg-white/[0.08]"
            >
              {isConnecting ? "Connecting..." : "Reconnect Instagram"}
            </Button>
          )}
          {connected && !appReviewMode && !onboarding && (
            <Button
              type="button"
              variant="outline"
              onClick={() => resubscribe.mutate()}
              disabled={resubscribe.isPending}
              className="min-h-11 w-full border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-200 dark:hover:bg-white/[0.08]"
            >
              {resubscribe.isPending ? "Resubscribing..." : "Resubscribe webhooks"}
            </Button>
          )}
          {connected && !appReviewMode && !onboarding && (
            <Button
              type="button"
              variant="outline"
              disabled
              className="min-h-11 w-full cursor-not-allowed border-red-200 bg-white px-4 text-sm font-bold text-red-400 opacity-70 dark:border-red-500/30 dark:bg-white/[0.04] dark:text-red-300"
            >
              Contact support to disconnect
            </Button>
          )}
        </div>
      </div>
      {connected && appReviewMode && !oauthSaveFailed && (
        <div className="mt-5 w-full rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm font-bold leading-relaxed text-emerald-800 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-100">
          Instagram connected. Comments and public replies are ready for campaigns.
        </div>
      )}
      {connected && appReviewMode && oauthSaveFailed && (
        <div className="mt-5 w-full rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold leading-relaxed text-amber-900 dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-100">
          Current saved connection{displayIntegration?.instagramUsername ? `: @${displayIntegration.instagramUsername}` : ""}.
        </div>
      )}
      {connected && !appReviewMode && (
        <div className="mt-5 w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600 dark:border-white/10 dark:bg-[#101827] dark:text-slate-300">
          <p className="font-black uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
            Webhook health
          </p>
          {displayIntegration?.instagramId && health?.data?.oauth?.reconnectRequired && (
            <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200">
              <p className="font-bold">Reconnect Instagram</p>
              <p className="mt-1 leading-relaxed">
                AP3k matched your real comment, but the selected Page token is missing or invalid.
                Click <strong>Reconnect Instagram</strong> above to re-authorise and restore DM delivery.
              </p>
              <ul className="mt-3 list-disc space-y-1 pl-5 text-xs leading-relaxed">
                <li>Token source attempted: <code className="rounded bg-red-100 px-1 font-mono">{health.data.oauth.tokenSource ?? "none"}</code></li>
                <li>Page token present: {health.data.oauth.tokenPresent ? "yes" : "no"}</li>
                <li>Token format valid: {health.data.oauth.tokenFormatValid ? "yes" : "no"}</li>
              </ul>
            </div>
          )}
          {health?.data?.subscription?.subscriptionMode === "META_DASHBOARD_MANAGED" && (
            <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100">
              <p className="font-bold">Meta dashboard subscription required</p>
              <p className="mt-1 leading-relaxed">
                AP3k is connected, but Meta did not allow API subscription because{" "}
                <code className="rounded bg-amber-100 px-1 font-mono text-xs">pages_manage_metadata</code>{" "}
                is unavailable. In Meta Developers, confirm the Webhook Subscription toggle is ON for
                this Instagram account and that comments and messages fields are subscribed.
              </p>
              <ul className="mt-3 list-disc space-y-1 pl-5 text-xs leading-relaxed">
                <li>Go to Meta Developers → Instagram API setup with Facebook login</li>
                <li>Find the Webhook Subscription section</li>
                <li>Confirm Webhook Subscription is ON for this account</li>
                <li>Confirm <strong>comments</strong> field is subscribed</li>
                <li>Confirm <strong>messages</strong> field is subscribed</li>
                <li>Test with a real comment from a separate accepted tester account</li>
              </ul>
            </div>
          )}
          <div className="mt-3 flex flex-wrap gap-2">
            <HealthBadge
              label="OAuth valid"
              ok={Boolean(health?.data?.oauth?.tokenUsable)}
            />
            <HealthBadge
              label="Token format"
              ok={Boolean(health?.data?.oauth?.tokenFormatValid)}
            />
            <HealthBadge
              label="Webhook status"
              ok={
                Boolean(health?.data?.lastCommentWebhook) ||
                Boolean(health?.data?.subscription?.subscribed) ||
                health?.data?.subscription?.subscriptionMode === "META_DASHBOARD_MANAGED"
              }
            />
            <HealthBadge
              label="Comment delivery active"
              ok={Boolean(health?.data?.lastCommentWebhook)}
            />
            <HealthBadge
              label="Messaging active"
              ok={!health?.data?.lastFailure?.errorMessage?.includes("dm_")}
            />
          </div>
          <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
            <HealthItem
              label="Page token"
              value={
                health?.data?.oauth
                  ? `${health.data.oauth.tokenPresent ? "stored" : "missing"} · ${health.data.oauth.tokenFormatValid ? "format ok" : "format invalid"}${health.data.oauth.tokenExpired ? " · expired" : ""}${health.data.oauth.tokenSource ? ` · source: ${health.data.oauth.tokenSource}` : ""}`
                  : "Unknown"
              }
            />
            <HealthItem
              label="Subscription attempted"
              value={
                health?.data?.subscription?.lastAttemptedAt
                  ? new Date(health.data.subscription.lastAttemptedAt).toLocaleString()
                  : "Never"
              }
            />
            <HealthItem
              label="Subscription result"
              value={
                health?.data?.subscription
                  ? health.data.subscription.subscriptionMode === "META_DASHBOARD_MANAGED"
                    ? "dashboard managed (see notice above)"
                    : `${health.data.subscription.subscribed ? "success" : "failure"}${
                        health.data.subscription.statusCode
                          ? ` · ${health.data.subscription.statusCode}`
                          : ""
                      }`
                  : "Unknown"
              }
            />
            <HealthItem
              label="Last webhook"
              value={formatHealth(health?.data?.lastWebhook)}
            />
            <HealthItem
              label="Last comment"
              value={formatHealth(health?.data?.lastCommentWebhook)}
            />
            <HealthItem
              label="Last failure"
              value={lastFailure.detail ? `${lastFailure.title} · ${lastFailure.detail}` : lastFailure.title}
            />
          </div>
          {!health?.data?.lastCommentWebhook && (
            <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100">
              No real comment webhook received from Meta yet. Check app mode,
              tester acceptance, media ownership, account type, and webhook subscription.
            </p>
          )}
          {health?.data?.lastCommentWebhook && (
            <p className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-100">
              Comment delivery active: ok. Last comment: {new Date(health.data.lastCommentWebhook.createdAt).toLocaleString()}.
              Outbound DM capability may still depend on Meta messaging approval.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default IntegrationCard;

function HealthBadge({ label, ok }: { label: string; ok: boolean }) {
  return (
    <span
      className={[
        "rounded-full border px-2.5 py-1 text-[11px] font-black",
        ok
            ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300"
          : "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200",
      ].join(" ")}
    >
      {label}: {ok ? "ok" : "check"}
    </span>
  );
}

function HealthItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-white/[0.04]">
      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
        {label}
      </p>
      <p className="mt-1 break-words font-bold text-slate-800 dark:text-slate-100">{value}</p>
    </div>
  );
}

function formatHealth(
  event?: {
    eventType: string;
    status: string;
    createdAt: Date | string;
  } | null
) {
  if (!event) return "None yet";
  const date = new Date(event.createdAt);
  return `${event.eventType} · ${event.status} · ${date.toLocaleString()}`;
}
